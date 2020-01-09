const DEBUG = true;

function isChinese() {
  const lang = chrome.i18n.getUILanguage()
  //return lang === "en" || lang === "en-US"
  return lang === "zh-CN" || lang === "zh"
}

chrome.webRequest.onBeforeRequest.addListener(
  function(details) {
    return {
      // If Lantern is running, we want to do something different here.
      redirectUrl: redirectTo(details)
    };
  },
  {urls: ["*://search.lantern.io/*"]},
  ["blocking"]);

function redirectTo(details) {
  // For whatever reason using a URL and searchParams doesn't work here, so parse manually.
  const queryKey = 'q='
  const n = details.url.search(queryKey) + queryKey.length
  const query = details.url.substring(n)
  if (isChinese()){
    return "https://www.baidu.com/s?ie=utf-8&wd="+query
  } else {
    log("Lantern redirecting to google")
    return "https://www.google.com/search?q="+query
  }
}

var ws = null;

function checkForMessages() {
  if (ws === null) {
    createWebSocket();
  }
}

var homepage = "https://lantern.io/"
var hasProxy = false
function lanternConnected() {
  return hasProxy
}

function createWebSocket() {
  chrome.runtime.getPackageDirectoryEntry(function(directoryEntry) {
    const directoryReader = directoryEntry.createReader();
    directoryReader.readEntries(function(entries) {
      for (var i = 0; i < entries.length; ++i) {
        if (entries[i].name == "data") {
          const dataDirReader = entries[i].createReader();
          dataDirReader.readEntries(function(dataEntries) {
            for (var i = 0; i < dataEntries.length; ++i) {
              if (dataEntries[i].isFile === true) {
                const fileEntry = dataEntries[i]
                fileEntry.file(function(file) {
                  const reader = new FileReader();
                  reader.onload = function(e) {
                    const settings = JSON.parse(e.target.result)
                    connect(settings)
                  };
                  reader.readAsText(file)
                })
                return
              }
            }
            log("no files in data dir")
          });
        }
      }
    });
  });
}

function connect(settings) {
  if (!settings.uiAddr) {
    log("No uiAddr in settings");
    return
  }
  const path = settings.uiAddr+'/'+settings.localHTTPToken
  var s = new WebSocket('ws://'+path+'/data');
  s.onerror = function(event) {
    lanternError();
  }
  s.onopen = function (event) {
    log("open");
    ws = s;
    lanternRunning(path);
  };
  s.onmessage = function (event) {
    log("got message from lantern");
    const dataJson = JSON.parse(event.data);
    const msg = dataJson.message;
    if (dataJson.type === "stats" && msg && msg.hasSucceedingProxy) {
      log("Lantern has hasSucceedingProxy: "+msg.hasSucceedingProxy)
      hasProxy = msg.hasSucceedingProxy
    }
    else if (dataJson.type === "settings" && msg && msg.hasSucceedingProxy) {
      log("Lantern has hasSucceedingProxy: "+msg.hasSucceedingProxy)
      hasProxy = msg.hasSucceedingProxy
    }
  };
  s.onclose = function() {
    lanternError();
  };
}

function lanternRunning(path) {
  homepage = "http://"+path
  chrome.browserAction.setIcon({
    path : {
      "16": "images/connected_16.png",
      "32": "images/connected_32.png",
      "64": "images/connected_64.png",
      "128": "images/connected_128.png"
    }
  });
}

function lanternError() {
  // Set the websocket to null so it will be re-opened on the next pass.
  homepage = "https://lantern.io/"
  ws = null;
  hasProxy = false;
  chrome.browserAction.setIcon({
    path : {
      "16": "images/disconnected_16.png",
      "32": "images/disconnected_32.png",
      "64": "images/disconnected_64.png",
      "128": "images/disconnected_128.png"
    }
  });
}

chrome.browserAction.onClicked.addListener(
  () => chrome.tabs.create({url: homepage})
);

function log(msg) {
  if (DEBUG) {
    console.log(msg);
  }
}

setInterval(checkForMessages, 2000);
