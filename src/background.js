const urls = {
    config: 'https://ytdl.yuji.app/config',
    // user: 'https://yuji.app/api/@me',
}

chrome.runtime.onInstalled.addListener(() => startup())
chrome.runtime.onStartup.addListener(() => startup())

const popups = [
    {
        popup: 'pages/youtube/popup.html',
        update: /youtube\.com\/(watch\?|shorts\/)/,
    },
    {
        popup: 'pages/discord/popup.html',
        update: /discord\.com\/channels\/[0-9]*\/[0-9]*/,
    },
]


chrome.tabs.onUpdated.addListener((...args) => {
    const tab = args[2]

    const page = popups.find(p => p.update.test(tab.url))
    if (!page) return chrome.action.disable(args[0]);

    setPopup(page.popup, args[0])
})

chrome.alarms.create('update', { periodInMinutes: 30 })
chrome.alarms.onAlarm.addListener(a => {
    if (a.name === 'update') get(urls)
})


function startup() {
    get(urls)
    chrome.action.disable()
}
function setPopup(dir, tabId) {
    chrome.action.setPopup({ popup: dir, tabId })
    chrome.action.enable(tabId)
}
async function get(reqs, setStorage = true) {
    const data = {}
    for (const key in reqs) {
        const op = reqs[key]
        const res = await fetch(op.url || op, {
            credentials: 'same-origin',
            method: op.method,
            headers: {
                'Content-Type': 'application/json',
                ...(op.headers || [])
            },
        })
        if (res.status >= 500) continue;

        data[key] = await res.json()
    }

    if (setStorage) chrome.storage.sync.set(data)
    return data
}