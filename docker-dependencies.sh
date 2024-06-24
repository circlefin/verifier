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

DOC_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

export APP_ENV=${APP_ENV:-dev}
# set suffix to username if it does not exist
USER_ID=$(id -u -n | sed 's/\./_/g')
export SUFFIX=${SUFFIX:-"_${USER_ID}"}

echo "APP_ENV is set to: ${APP_ENV} SUFFIX is: ${SUFFIX}"

# Start dependencies
docker-compose -f "${DOC_ROOT}/docker-compose.yml" up -d postgres

# healthcheck
COUNT=20
check_health() {
  CONTAINER=$(docker-compose ps -q "$1")
  for ((i = 1; i <= COUNT; i++)); do

    RESULT=$(docker ps -q --filter health=healthy --filter id="${CONTAINER}" | wc -l)
    if [[ ${RESULT} -eq 1 ]]; then
      echo -e "${1} healthy!!!\n"
      break
    else
      echo "${1} not healthy.  Attempt $i of ${COUNT}. Retrying in 10 seconds."
      if [[ "${i}" != "${COUNT}" ]]; then
        sleep 10
      fi
    fi

    if [[ "$i" == "${COUNT}" ]]; then
      echo -e "ERROR: $1 not healthy after ${COUNT} attempts. Aborting"
      docker-compose logs "$1"
      exit 1
    fi
  done
}

check_health postgres

echo "Successfully started dependency docker containers!"
