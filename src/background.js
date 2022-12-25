// import 'chrome';
const requests = {
    config: 'https://yuji.app/extension/config',
    // user: 'https://yuji.app/api/@me',
}

chrome.runtime.onInstalled.addListener(async () => {
    const data = {}
    for (const key in requests) {
        const op = requests[key]
        const res = await fetch(op.url || op, {
            credentials: 'same-origin',
            method: op.method || 'put',
            headers: {
                'Content-Type': 'application/json',
                ...(op.headers || [])
            },
        })
        if (res.status >= 500) continue;

        data[key] = await res.json()
    }
    chrome.storage.sync.set(data)
    chrome.action.disable()
});

function setPopup(dir, tabId) {
    try {
        chrome.action.setPopup({ popup: dir, tabId })
        chrome.action.enable(tabId)
    } catch (e) {
        console.log(e)
        chrome.action.setPopup({ popup: dir })
    }
}

const pages = [
    {
        popup: 'pages/youtube/popup.html',
        update: /youtube.com\/watch|\/shorts\//,
    },
    {
        popup: 'pages/discord/popup.html',
        update: /discord.com\/channels\/[0-9]*\/[0-9]*/,
    },
]


chrome.tabs.onUpdated.addListener((...args) => {
    const tab = args[2]

    const page = pages.find(p => p.update.test(tab.url))
    if (!page) return chrome.action.disable(tab.id);

    setPopup(page.popup, tab.id)
})