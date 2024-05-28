#!/usr/bin/env bash
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
