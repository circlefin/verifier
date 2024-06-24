#!/usr/bin/env bash

# Copyright 2024 Circle Internet Financial, LTD.  All rights reserved.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
#
# SPDX-License-Identifier: Apache-2.0

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
