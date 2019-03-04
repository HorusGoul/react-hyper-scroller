#!/bin/bash

function killAppServer {
  ps axf | grep test-app | grep -v grep | grep start.js | awk '{ print "kill " $1 }' | sh
}


killAppServer

npm run build

cd test/test-app

npm run start &

cd ../../

npm run debug

killAppServer

