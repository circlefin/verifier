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

# exit on failure
set -e

DOC_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# migrate the DB
echo "dumping DB config for creating DB.."
set -o allexport; source "${DOC_ROOT}/packages/verifier/.env"; set +o allexport
set +x
export MIGRATE_DB_USER="dba"
export MIGRATE_DB_PASSWORD="T3ndren!!"
set -x
"${DOC_ROOT}"/docker/usr/local/circle/migrate.sh
echo "Successfully created and migrated DB"
