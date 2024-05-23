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


set +x

# Validate and prepare the DB for connection

if [ -z "${DB_PORT}" ]; then
  echo "Use default value for DB_PORT"
  export DB_PORT=5432
fi

if [ -z "${DB_HOST}" ]; then echo "Missing environment variable DB_HOST"; exit 1; fi
if [ -z "${DB_USER}" ]; then echo "Missing environment variable DB_USER"; exit 1; fi
if [ -z "${DB_PASSWORD}" ]; then echo "Missing environment variable DB_PASSWORD"; exit 1; fi
if [ -z "${DB_DATABASE}" ]; then echo "Missing environment variable DB_DATABASE"; exit 1; fi
if [ -z "${DB_SCHEMA}" ]; then echo "Missing environment variable DB_SCHEMA"; exit 1; fi

export DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_DATABASE}?schema=${DB_SCHEMA}"
DATABASE_URL_PRINT="postgresql://${DB_USER}:<hidden DB_PASSWORD>@${DB_HOST}:${DB_PORT}/${DB_DATABASE}?schema=${DB_SCHEMA}"
echo "DB_url=${DATABASE_URL_PRINT}"
