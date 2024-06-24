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
# exit on failure

set -e

DOC_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# migrate the DB
echo "dumping DB config for creating DB.."
set -o allexport; source "${DOC_ROOT}/packages/verifier/.env"; set +o allexport
set +x
export MIGRATE_DB_USER="dba"
export MIGRATE_DB_PASSWORD="TestPassWord!!"
set -x
"${DOC_ROOT}"/docker/usr/local/verifier/migrate.sh
echo "Successfully created and migrated DB"
