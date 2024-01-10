export function script(tabId, ...args) {
    return new Promise((resolve) => {
        const data = { target: { tabId } }
        args.forEach(a => typeof a === 'function' ? data.func = a : data.args = a)
        chrome.scripting.executeScript(data, ([{ result }]) => resolve(result))
    })
}