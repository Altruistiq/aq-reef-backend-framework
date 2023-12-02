#!/bin/sh
set -e
currentDir=$(pwd)
rm -rf "$currentDir/tests/test-server/node_modules"
rm -rf "$currentDir/tests/test-server/reef"
pnpm --prefix "$currentDir/tests/test-server" install
rm -rf ./pkg
pnpm tsc
ln -s "$currentDir/pkg" "$currentDir/tests/test-server/reef"
if [ "$1" = "watch" ]; then
    npx mocha --config .mocharc.json --watch
else
    npx mocha --config .mocharc.json
fi

