# Lantern Chrome Extension

Google Chrome extension for Lantern

## Installation

### Manual Installation
- Clone this repo
- Navigate to chrome://extensions/ and check the box for "Developer mode" in the top right.
- Press the "Load unpacked" button on the top left of the screen
- Navigate to and select the directory where you've cloned this repo to

### Install from Chrome
- Navigate to https://chrome.google.com/webstore/detail/lantern-search/akppoapgnchinmnbinihafkogdohpbmk?authuser=1
- Click "Add to Chrome"
- Follow any additional instructions

## Start Lantern
If you've installed this extension manually (as during development), you'll need to start lantern with the `LANTERN_CHROME_EXTENSION` environment variable set to the data directory of this repo:
```
$ LANTERN_CHROME_EXTENSION="/Users/me/lantern/lantern-chrome-extension/data" ./lantern
```
where `/Users/me/lantern/lantern-chrome-extension` represents the path to this repo

Otherwise, if you've installed this extension from google, you can start lantern in the normal way.
