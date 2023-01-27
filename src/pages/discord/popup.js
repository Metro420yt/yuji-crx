var guild
const loading = document.getElementById('loading')
window.onload = async () => {
    const tab = (await chrome.tabs.query({ active: true, lastFocusedWindow: true }))[0]
    var guildId = tab.url.split('discord.com/')[1].split('/')[1]
    if (guildId === '@me') return;

    const res = await fetch(`https://yuji.app/api/guild/${guildId}`, {
        method: 'put',
        credentials: 'include'
    })
    if (res.status >= 500) {
        return setTimeout(() => window.onload(), 500)
    }
    guild = await res.json()
    if (res.status !== 200) {
        console.log(guild, res)
        if (guild.loggedIn === false) {
            const e = document.createElement('a')
            e.innerText = 'Click to login'
            e.href = 'https://yuji.app/login?action=closetab'
            e.class = 'full-msg'
            e.target = 'blank'

            document.body.appendChild(e)
        }
        else {
            const e = document.createElement('p')
            e.innerText = guild.error || guild.message || 'Unable to get server'
            document.getElementById('serverSettings').appendChild(e)

            // setTimeout(window.close, 5000)
        }
        loading.remove()
        return;
    };

    const objFn = (object, addto) => {
        for (const key in object) {
            const div = document.createElement('div')
            div.setAttribute('class', 'item')

            if (typeof object[key] === 'boolean') {
                const input = document.createElement('input')
                input.setAttribute('type', 'checkbox')
                input.id = key
                if (object[key]) input.setAttribute('checked', '')

                const p = document.createElement('p')
                p.innerText = key

                div.appendChild(input)
                div.appendChild(p)
            }
            else if (typeof object[key] === 'string') {
                const input = document.createElement('input')
                input.setAttribute('type', 'text')
                input.id = key
                input.setAttribute('value', object[key])

                const p = document.createElement('p')
                p.innerText = key

                div.appendChild(p)
                div.appendChild(input)
            }
            else if (typeof object[key] === 'object') {
                const e = document.createElement('div')

                const p = document.createElement('p')
                p.innerText = key

                div.appendChild(e)
                div.appendChild(p)

                objFn(object[key], e)
            }
            addto.append(div)
        }
    }
    const settings = document.getElementById('serverSettings')
    objFn(guild.settings, settings)

    const submit = document.createElement('div')
    submit.setAttribute('class', 'button')
    submit.innerText = 'Save'
    settings.appendChild(submit)
    submit.addEventListener('click', save)

    const outlink = document.getElementById('outlink')
    outlink.href = `https://yuji.app/server/${guildId}`
    outlink.style = null

    loading.style.display = 'none'
}

async function save() {
    const settings = {}
    const settingObjFn = (object) => {
        for (const key in object) {
            if (typeof object[key] === 'object') settingObjFn(object[key])
            else settings[key] = object[key]
        }
    }
    settingObjFn(guild.settings)

    const formSettings = {}
    for (const e of Array.from(document.getElementById('serverSettings'))) formSettings[e.id] = e.type === 'checkbox' ? e.checked : e.value

    const settingsDif = {}
    for (const key in formSettings) if (formSettings[key] !== settings[key]) settingsDif[key] = formSettings[key]
    console.log(settingsDif)
    if (Object.keys(settingsDif).length === 0) return;

    loading.style.display = 'block'
    const res = await fetch(`https://yuji.app/api/guild/${guild.guildID}`, {
        method: 'PATCH',
        body: JSON.stringify({ settings: settingsDif }),
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
        },
    })
    if (res.status >= 500) return alert('couldnt save')
    guild = await res.json()
    loading.style.display = 'none'
    update()
}

function update() {
    const objFn = (object) => {
        for (const key in object) {
            if (typeof object[key] === 'object') objFn(object[key])
            else {
                const e = document.getElementById(key)
                if (typeof object[key] === 'boolean') e.checked = object[key]
                else if (typeof object[key] === 'string') e.value = object[key]
            }
        }

    }
    objFn(guild.settings)
}