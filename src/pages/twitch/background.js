import { script } from "../../functions.js"

export default async (tab) => {
    const watchingStream = await script(tab.id, () => document.getElementById('live-page-chat'))

    if (watchingStream) chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
            console.log('now auto claiming')
            if (window.yujiAutoClaim) clearInterval(window.yujiAutoClaim)

            window.yujiAutoClaim = setInterval(() => {
                const claim = document.querySelector('button[aria-label="Claim Bonus"]')
                if (!claim) return
                claim.click()
                console.log('claimed channel points')
            }, 5000)
        }
    })

}