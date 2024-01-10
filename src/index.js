import { default as twitchBg } from "./pages/twitch/background.js"
const { name, version } = chrome.runtime.getManifest()

const urls = {
    config: `https://yuji.app/crx/config`,
}

chrome.runtime.onInstalled.addListener(() => startup())
chrome.runtime.onStartup.addListener(() => startup())

const popups = [
    {
        popup: 'pages/youtube/popup.html',
        regex: /youtube\.com\/(watch\?|shorts\/)/,
    },
    {
        popup: 'pages/discord/popup.html',
        regex: /discord\.com\/channels\/[0-9]*\/[0-9]*/,
    },
    {
        regex: /twitch\.tv\/([0-z])*$/,
        background: twitchBg
    },
]


chrome.tabs.onUpdated.addListener((...args) => {
    const tab = args[2]
    if (tab.status !== 'complete') return;

    const page = popups.find(p => p.regex.test(tab.url))
    if (!page) return chrome.action.disable(args[0]);

    if (page.popup) setPopup(page.popup, tab.id)
    else chrome.action.disable(args[0]);

    if (page.background) page.background(tab)
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
                'x-crx-agent': `-${name} ${version}`,
                'x-crx-author': '@metro420yt (contact@yuji.app)',
                ...(op.headers || [])
            },
        })
        if (res.status >= 500) continue;

        data[key] = await res.json()
    }

    if (setStorage) chrome.storage.local.set(data)
    return data
}