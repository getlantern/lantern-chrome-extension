var ws = null;

function checkForMessages() {
  if (ws == null) {
    ws = createWebSocket();
  }
}

function createWebSocket() {
  var s = new WebSocket('ws://127.0.0.1:16823/data');
  s.onmessage = function (event) {
    const msg = JSON.parse(event.data);
    const msgType = msg.type;
    if (msgType != "notification") {
      return;
    }

    const backendId = msg.message.ID;
    const raw = msg.message.Message;
    const buttons = msg.message.Buttons;

    var b = [];
    for (var i = 0; i < buttons.length; i++) {
      var but = buttons[i];
      b.push({title: but.Title, iconUrl: but.IconUrl})
    }
    if (raw !== null && raw !== undefined && raw != "") {
      chrome.notifications.create(backendId, {
        type: msg.message.Type,
        iconUrl: msg.message.IconURL,
        title: msg.message.Title,
        message: raw,
        buttons: b,
        isClickable: msg.message.IsClickable,
        requireInteraction: msg.message.RequireInteraction,
      });
      chrome.notifications.onButtonClicked.addListener(function(id, idx) {
        if (id == backendId) {
          chrome.notifications.clear(id);
        }
        if (idx < buttons.length) {
          var clickUrl = buttons[idx].ClickURL;
          if (clickUrl !== null && clickUrl !== undefined && clickUrl != "") {
            chrome.tabs.create({ url: clickUrl });
          }
        }
      });
    }
  };
  s.onclose = function() {
    // Just set the variable to null so it will be re-opened on the
    // next pass.
    ws = null;
  };
}

// Disable the popup by default
chrome.browserAction.disable();

periodicCheck = setInterval(checkForMessages, 5000);
