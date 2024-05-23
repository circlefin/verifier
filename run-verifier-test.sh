#!/usr/bin/env bash
#
# Copyright (c) 2022, Circle Internet Financial Trading Company Limited.
# All rights reserved.
#
# Circle Internet Financial Trading Company Limited CONFIDENTIAL
#
# This file includes unpublished proprietary source code of Circle Internet
# Financial Trading Company Limited, Inc. The copyright notice above does not
# evidence any actual or intended publication of such source code. Disclosure
# of this source code or any related proprietary information is strictly
# prohibited without the express written permission of Circle Internet Financial
# Trading Company Limited.
#

# exit when any command fails
set -e

pip3 install "pyjwt[crypto]"

npm run --silent start&

# healthcheck
count=20
url="http://localhost:3000/ping"
check_health() {
  for ((i = 1; i <= count; i++)); do
    result=$(curl -k -s -o /dev/null -w "%{http_code}" $url)

    if [ "$result" = "200" ]; then
      echo "$url responsive. PONG!!!"
      break
    else
      # none of the URLs returned 200 error code response
      echo -e "\nunresponsive.  Attempt $i of $count. Retrying in 10 seconds.\n"
      if [ "$i" != "$count" ]; then
        sleep 10
      fi
    fi

    if [ "$i" == "$count" ]; then
      echo -e "\nERROR: unresponsive after $count attempts. Aborting\n"
      exit 1
    fi
  done
}

check_health

pushd test-scripts
python3 verifier-test.py

ret=$?
if [ $ret -ne 0 ]; then
    exit 1
fi
popd
