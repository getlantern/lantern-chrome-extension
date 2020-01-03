chrome.webRequest.onBeforeRequest.addListener(
  function(details) {
    return {
      // If Lantern is running, we want to do something different here.
      redirectUrl: details.url.replace("search.lantern.io", "cse.google.com")
    };
  },
  {urls: ["*://search.lantern.io/*"]},
  ["blocking"]);
