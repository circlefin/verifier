#!/usr/bin/env bash
# Copyright (c) 2023, Circle Internet Financial Trading Company Limited.
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

DOCROOT="$( cd "$( dirname "$0" )" && pwd )"

export APP_ENV=${APP_ENV:-dev}
# set suffix to username if it does not exist
USER_ID=$(id -u -n | sed 's/\./_/g')
export SUFFIX=${SUFFIX:-"_${USER_ID}"}

echo "APP_ENV is set to: ${APP_ENV} SUFFIX is: ${SUFFIX}"

while getopts ":u:p:ir" OPTION
do
    case ${OPTION} in
    r)
        RESTART=true
        ;;
    i)
        PULL_IMAGES=true
        RESTART=true
        ;;
    ?)
        usage
        exit
        ;;
    esac
done


# Make sure we are starting with a clean slate;
# stop and remove any running containers.
if [[ "${RESTART}" = true ]] ; then
    echo 'Stopping and removing any running containers.'
    docker-compose -f ${DOCROOT}/docker-compose.yml down
fi


# Pull latest container images.
if [[ "${PULL_IMAGES}" = true ]] ; then
    echo 'Pulling latest container images from ECR.'
    docker-compose -f ${DOCROOT}/docker-compose.yml pull
fi


# Start the dbs first.
docker-compose -f ${DOCROOT}/docker-compose.yml up -d postgres

# Give them breathing room.
sleep 5

COUNT=10
check_health(){
    CONTAINER=$(docker-compose ps -q $1)
    for (( i=1 ; i <= COUNT; i++ )); do

      RESULT=$(docker ps -q --filter health=healthy --filter id=${CONTAINER} | wc -l)
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

echo "Successfully started docker containers!"
