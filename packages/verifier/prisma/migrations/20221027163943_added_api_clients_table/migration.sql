-- Copyright 2024 Circle Internet Financial, LTD.  All rights reserved.
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

-- CreateTable
CREATE TABLE "api_clients" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    "did" TEXT NOT NULL,
    "apiToken" TEXT NOT NULL,
    "legalTermVersion" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresInSeconds" INTEGER NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "revokedReason" VARCHAR(200),
    "revokedBy" TEXT
);

-- CreateIndex
CREATE INDEX "api_clients_did_idx" ON "api_clients"("did");
CREATE INDEX "api_clients_revokedAt_idx" ON "api_clients"("revokedAt");


-- GrantAccess
GRANT INSERT, SELECT, UPDATE, DELETE ON "verifier"."api_clients" TO verifier;

DO
$$
    BEGIN
        IF EXISTS(
              SELECT *
              FROM pg_catalog.pg_user
              WHERE usename = 'pi_ro_dbuser')
        THEN
            GRANT SELECT ON "verifier"."api_clients" TO pi_ro_dbuser;
        END IF;
    END
$$;
