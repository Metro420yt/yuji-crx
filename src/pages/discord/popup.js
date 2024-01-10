const loading = document.getElementById('loading')
const settings = document.getElementById('settings')
const outlink = document.getElementById('outlink')
const saveBttn = document.getElementById('save')

window.onload = async () => {
    const tab = (await chrome.tabs.query({ active: true }))[0]
    var guildId = tab.url.split('discord.com/')[1].split('/')[1]
    if (guildId === '@me') return;

    const res = await fetch(`https://yuji.app/api/guild/${guildId}`, {
        method: 'put',
        credentials: 'include'
    })
    if (res.status >= 500) return setTimeout(() => window.onload(), 1000)
    loading.remove()

    const guild = await res.json()
    window.guild = guild
    if (res.status !== 200) {
        if (guild.loggedIn === false) {
            document.getElementById('loginPrompt').style = null

            outlink.remove()
            saveBttn.remove()
        }
        else {
            const e = document.createElement('p')
            e.innerText = guild.error || guild.message || 'Unable to get server'
            settings.appendChild(e)
        }
        return;
    };

    upsertInfo()

    outlink.style = null
    saveBttn.style = null

    outlink.addEventListener('click', () => chrome.tabs.create({ url: `https://yuji.app/server/${guild.guildID}` }))
    saveBttn.addEventListener('click', ({ target }) => save(target))
    loading.remove()
}

function upsertInfo() {
    const { guild } = window

    const add = (key, value, addto, parent) => {
        const oldElements = Array.from(document.querySelectorAll(`[data-key="${key}"]`))

        const input = oldElements.find(e => e.tagName === 'INPUT') || document.createElement('input')
        const text = oldElements.find(e => e.tagName === 'P') || document.createElement('p')


        if (oldElements.length === 0) {
            input.dataset.key = key
            text.dataset.key = key
            text.innerText = guild.conversion[key]

            if (parent) {
                input.dataset.parent = parent
                text.dataset.parent = parent
            }

            if (typeof value === 'boolean') {
                input.type = 'checkbox'
                input.checked = value

                addto.appendChild(input)
                addto.appendChild(text)

                const fn = ({ target }) => {
                    const i = document.querySelector(`input[data-key="${target.dataset.key}"]`)
                    i.checked = !i.checked || false
                }
                text.addEventListener('click', fn)
                text.dataset.clickable = true
            }
            else if (typeof value === 'string') {
                input.value = value
                input.type = 'text'

                const div = document.createElement('div')
                div.appendChild(text)
                div.appendChild(input)

                addto.appendChild(div)
            }
            else if (typeof value === 'object') {
                const sub = document.createElement('div')
                sub.dataset.key = key
                sub.classList = 'sub'

                text.innerText = guild.conversion[`sub:${key}`]
                sub.appendChild(text)

                for (const k in value) add(k, value[k], sub, key)
                addto.appendChild(sub)
            }
        }
        else {
            if (typeof value === 'boolean') input.checked = value
            else if (typeof value === 'string') input.value = value
            else if (typeof value === 'object') for (const k in value) add(k, value[k], input.parentElement, key)
        }
    }

    for (const key in guild.settings) add(key, guild.settings[key], settings)
}

async function save(target) {
    const { guild } = window
    const map = {}
    const mapValues = (element) => {
        const value = element.type === 'checkbox' ? element.checked : element.value
        const parent = element.dataset.parent
        const key = element.dataset.key

        if ((guild.settings[key] || guild.settings[parent]?.[key]) === value) return;

        if (parent && !map[parent]) map[parent] = {}
        parent ? map[parent][key] = value : map[key] = value
    }
    Array.from(settings).forEach(e => mapValues(e))
    if (Object.keys(map).length === 0) return;

    target.innerText = 'Saving...'
    target.style.cursor = 'not-allowed'
    target.disabled = true

    const body = { settings: map }
    const res = await fetch(`https://yuji.app/api/guild/${guild.guildID}`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(body)
    })
    if (res.status >= 500) return;

    window.guild = await res.json()
    upsertInfo()

    target.innerText = 'Save'
    target.style = null
    target.disabled = false
}