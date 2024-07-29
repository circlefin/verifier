#!/usr/bin/env bash
# Copyright 2024 Circle Internet Group, Inc.  All rights reserved.
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

set -xe


# Use the migration user to connect the DB and create the schema and database of "verifier"
source "$(dirname "${BASH_SOURCE[0]}")/prepare_db.sh"
if [ -z "${MIGRATE_DB_USER}" ] || [ -z "${MIGRATE_DB_PASSWORD}" ]; then
  echo "Missing migration user and password variable(s)"
  exit 1
else
  echo "Using MIGRATE_DB_USER=${MIGRATE_DB_USER} to create DB."
fi
echo "Creating DB.."
npm run createdb -w verifier

# Use the migrate user to run prisma migrate
set +x
export DB_USER=${MIGRATE_DB_USER}
export DB_PASSWORD=${MIGRATE_DB_PASSWORD}
source "$(dirname "${BASH_SOURCE[0]}")/prepare_db.sh"
set -x

echo "Migrating DB.."
npm run prisma:migrate:deploy -w verifier
