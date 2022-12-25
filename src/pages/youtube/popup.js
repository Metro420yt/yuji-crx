const button = document.getElementById('yuji-download-video')
const settings = document.getElementById('settings')


button.addEventListener('click', async () => {
  const tab = (await chrome.tabs.query({ active: true, lastFocusedWindow: true }))[0]
  if (!tab) return console.log('not in a tab');

  if (tab.url.includes('/shorts/')) tab.url = tab.url.replace('shorts/', 'watch?v=')

  const querys = tab.url
    .split('?')
    .slice(1)
    .join('?')
    .split('&')

  for (const s of Array.from(settings)) {
    if (s.type === 'checkbox' && s.checked) querys.push(s.dataset.query)
  }

  var { config } = await chrome.storage.sync.get('config')
  chrome.tabs.create({ url: `${config.downloader.baseUrl}?${querys.join('&')}` })
})

window.onload = async () => {
  const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true })
  // const tab = await chrome.tabs.getCurrent()

  if (
    !tab?.url
    || !['/watch?', '/shorts/'].some(url => tab.url.includes(url))
  ) {
    button.innerText = 'Not on a video'
    settings.style.display = 'none'
    return;
  }


  var { config } = await chrome.storage.sync.get('config')
  for (const s of config.downloader.settings) {
    const div = document.createElement('div')
    const input = document.createElement(s.tag || 'input')
    if (s.data) for (const key in s.data) input.dataset[key] = s.data[key]
    if (!s.tag || s.tag === 'input') input.type = s.type || 'checkbox'

    if (s.options) for (const op of s.options) {
      const e = document.createElement('option')
      e.innerText = op.label
      e.value = op.value
      input.appendChild(e)
    }


    div.appendChild(input)
    if (s.text) {
      const text = document.createElement('option')
      text.innerText = s.text
      div.appendChild(text)
    }
    settings.appendChild(div)
  }

  var title = tab.title.replace(/^\(\d*\)/, '').trim()
  if (title.includes('- YouTube')) title = title.split('- YouTube')[0]
  button.innerText = `Download ${title || 'Video'}`
}