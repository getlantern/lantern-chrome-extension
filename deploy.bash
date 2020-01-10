#!/usr/bin/env bash

function die() {
  echo "$@"
  exit 1
}

zip -r lantern _locales data/base images manifest.json src || die "Error zipping"

python -mwebbrowser "https://chrome.google.com/u/1/webstore/devconsole/g03333245238207858850/akppoapgnchinmnbinihafkogdohpbmk/edit/package?hl=en"
