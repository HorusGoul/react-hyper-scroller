#!/bin/bash

function killAppServer {
  ps axf | grep test-app | grep -v grep | grep start.js | awk '{ print "kill " $1 }' | sh
}

killAppServer

cd e2e/test-app

npm ci
npm run start &

cd ../../

npm run test:e2e
TEST_STATUS=$?

killAppServer

exit $TEST_STATUS

