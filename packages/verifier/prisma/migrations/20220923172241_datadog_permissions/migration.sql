-- Copyright 2024 Circle Internet Group, Inc.  All rights reserved.
--
-- Licensed under the Apache License, Version 2.0 (the "License");
-- you may not use this file except in compliance with the License.
-- You may obtain a copy of the License at
--
--     http://www.apache.org/licenses/LICENSE-2.0
--
-- Unless required by applicable law or agreed to in writing, software
-- distributed under the License is distributed on an "AS IS" BASIS,
-- WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
-- See the License for the specific language governing permissions and
-- limitations under the License.
--
-- SPDX-License-Identifier: Apache-2.0

-- Create datadog schema.
CREATE SCHEMA IF NOT EXISTS datadog;

-- Create datadog db user
-- In smokebox/sandbox/stg/prod the user _should_ already exist.
-- The CREATE ROLE is here to avoid problems in dev and QA.
-- The password doesn't matter, so we'll reuse the one that already exists.
DO
$$
    BEGIN
        IF NOT EXISTS(
                SELECT *
                FROM pg_catalog.pg_user
                WHERE usename = 'datadog')
        THEN
            CREATE ROLE datadog LOGIN PASSWORD '${DB_PASSWORD}';
        END IF;
    END
$$;

-- Grants for datadog user to all appropriate schemas.
GRANT USAGE ON SCHEMA public TO datadog;
GRANT USAGE ON SCHEMA datadog TO datadog;
GRANT USAGE ON SCHEMA verifier TO datadog;

-- Grant pg_monitor to datadog user.
GRANT pg_monitor TO datadog;

-- Load pg_stat_statements extension in current database.
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- Add function to generate explain plans.
CREATE OR REPLACE FUNCTION datadog.explain_statement (
   l_query text,
   out explain JSON
)
RETURNS SETOF JSON AS
$$
    BEGIN
       RETURN QUERY EXECUTE 'EXPLAIN (FORMAT JSON) ' || l_query;
    END;
$$
LANGUAGE 'plpgsql'
RETURNS NULL ON NULL INPUT
SECURITY DEFINER;
