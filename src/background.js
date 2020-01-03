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
  const queryKey = 'gsc.q='
  const n = details.url.search(queryKey) + queryKey.length
  const query = details.url.substring(n)
  if (lanternConnected()) {
    return details.url.replace("search.lantern.io", "cse.google.com")
  } else if (isChinese()){
    return "https://www.baidu.com/s?ie=utf-8&wd="+query
  } else {
    return "https://www.google.com/search?q="+query
  }
}

var ws = null;

function checkForMessages() {
  if (ws === null) {
    createWebSocket();
  }
}

var hasProxy = false
function lanternConnected() {
  return hasProxy
}

function createWebSocket() {
  const url = chrome.runtime.getURL("settings.json");
  fetch(url)
    .then((response) => response.json())
    .then((json) => connect(json))
    .catch(function(err) {
      console.log('Fetch Error :-S', err);
    });
}

function connect(settings) {
  s = new WebSocket('ws://'+settings.uiAddr+'/'+settings.localHTTPToken+'/data');
  s.onerror = function(event){
    console.log("Error");
    lanternError();
  }
  s.onopen = function (event) {
    console.log("open");
    ws = s
  };
  s.onmessage = function (event) {
    console.log("got message from lantern")
    const dataJson = JSON.parse(event.data)
    const msg = dataJson.message
    if (dataJson.type === "stats" && "hasSucceedingProxy" in msg) {
      console.log("Lantern has hasSucceedingProxy: "+msg.hasSucceedingProxy)
      hasProxy = msg.hasSucceedingProxy
    }
  };
  s.onclose = function() {
    lanternError()
  };
}

function lanternError() {
  // Set the websocket to null so it will be re-opened on the next pass.
  ws = null;
  hasProxy = false;
}

// Disable the popup by default
chrome.browserAction.disable();

periodicCheck = setInterval(checkForMessages, 2000);
