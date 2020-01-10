#!/usr/bin/env bash

function die() {
  echo "$@"
  exit 1
}

if [ "$#" -ne 1 ]; then
  die "version required, as in $0 0.0.7"
fi

VERSION=$1

function bumpManifestVersion() {
  perl -pi -e "s|version\\\": \\\"\d+\.\d+\.\d+\\\"|version\\\": \\\"$VERSION\\\"|g"  manifest.json || die "Could not set version"
  git add manifest.json || die "Could not add manifest to git"
  git commit -m "bumped manifes version to $VERSION" || die "Could not commit new manifest version"
  git push origin master || die "Could not push to master"
}

bumpManifestVersion

rm -f lantern.zip
zip -r lantern _locales data/base images manifest.json src || die "Error zipping"
python -mwebbrowser "https://chrome.google.com/u/1/webstore/devconsole/g03333245238207858850/akppoapgnchinmnbinihafkogdohpbmk/edit/package?hl=en"
