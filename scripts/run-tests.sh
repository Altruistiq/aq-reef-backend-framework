#!/bin/sh
set -e
currentDir=$(pwd)
rm -rf "$currentDir/tests/test-server/node_modules"
rm -rf "$currentDir/tests/test-server/reef"
npm --prefix "$currentDir/tests/test-server" i
ln -s "$currentDir/src" "$currentDir/tests/test-server/reef"
npx mocha --config .mocharc.json

