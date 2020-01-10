const DEBUG = true

function isChinese() {
  const lang = chrome.i18n.getUILanguage()
  // return lang === "en" || lang === "en-US"
  return lang === 'zh-CN' || lang === 'zh'
}

function log(msg) {
  if (DEBUG) {
    console.log(msg)
  }
}

function redirectTo(details) {
  // For whatever reason using a URL and searchParams doesn't work here, so parse manually.
  const queryKey = 'q='
  const n = details.url.search(queryKey) + queryKey.length
  const query = details.url.substring(n)
  if (isChinese()) {
    return `https://www.baidu.com/s?ie=utf-8&wd=${query}`
  }
  return `https://www.google.com/search?q=${query}`
}

let ws = null

let homepage = 'https://lantern.io/'
let hasProxy = false
function lanternConnected() {
  return hasProxy
}

function lanternRunning(path) {
  homepage = `http://${path}`
  chrome.browserAction.setIcon({
    path: {
      16: 'images/connected_16.png',
      32: 'images/connected_32.png',
      64: 'images/connected_64.png',
      128: 'images/connected_128.png',
    },
  })
}

function lanternError() {
  // Set the websocket to null so it will be re-opened on the next pass.
  homepage = 'https://lantern.io/'
  ws = null
  hasProxy = false
  chrome.browserAction.setIcon({
    path: {
      16: 'images/disconnected_16.png',
      32: 'images/disconnected_32.png',
      64: 'images/disconnected_64.png',
      128: 'images/disconnected_128.png',
    },
  })
}

function connect(settings) {
  if (!settings.uiAddr) {
    log('No uiAddr in settings')
    return
  }
  const path = `${settings.uiAddr}/${settings.localHTTPToken}`
  const s = new WebSocket(`ws://${path}/data`)
  s.onerror = () => {
    lanternError()
  }
  s.onopen = () => {
    log('open')
    ws = s
    lanternRunning(path)
  }
  s.onmessage = (event) => {
    log('got message from lantern')
    const dataJson = JSON.parse(event.data)
    const msg = dataJson.message
    if (dataJson.type === 'stats' && msg && msg.hasSucceedingProxy) {
      log(`Lantern has hasSucceedingProxy: ${msg.hasSucceedingProxy}`)
      hasProxy = msg.hasSucceedingProxy
    } else if (dataJson.type === 'settings' && msg && msg.hasSucceedingProxy) {
      log(`Lantern has hasSucceedingProxy: ${msg.hasSucceedingProxy}`)
      hasProxy = msg.hasSucceedingProxy
    }
  }
  s.onclose = () => {
    lanternError()
  }
}

function createWebSocket() {
  // We have to do this in fairly roundabout fashion because just loading a new file
  // via a URL ends up marking the extension as corrupted.
  chrome.runtime.getPackageDirectoryEntry((directoryEntry) => {
    const directoryReader = directoryEntry.createReader()
    directoryReader.readEntries((entries) => {
      const entry = entries.find((e) => e.name === 'data')
      if (typeof entry === 'undefined') {
        log('could not find data directory')
        return
      }
      const dataDirReader = entry.createReader()
      dataDirReader.readEntries((dataEntries) => {
        // This requires that there's only one file in the data directory
        const fileEntry = dataEntries.find((e) => e.isFile)
        if (typeof fileEntry === 'undefined') {
          log('no files in data directory')
          return
        }
        fileEntry.file((file) => {
          const reader = new FileReader()
          reader.onload = (e) => {
            try {
              const settings = JSON.parse(e.target.result)
              connect(settings)
            } catch (exc) {
              log(`error parsing JSON from ${file.name}: ${exc}`)
            }
          }
          reader.readAsText(file)
        })
      })
    })
  })
}

chrome.browserAction.onClicked.addListener(
  () => chrome.tabs.create({ url: homepage }),
)

chrome.webRequest.onBeforeRequest.addListener(
  (details) => {
    if (lanternConnected()) {
      return {}
    }
    return {
      redirectUrl: redirectTo(details),
    }
  },
  { urls: ['*://search.lantern.io/*'] },
  ['blocking'],
)

function checkForMessages() {
  if (ws === null) {
    createWebSocket()
  }
}

setInterval(checkForMessages, 2000)
