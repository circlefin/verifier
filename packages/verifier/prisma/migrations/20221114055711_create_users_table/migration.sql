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

/*
  Warnings:

  - You are about to drop the column `apiToken` on the `api_clients` table. All the data in the column will be lost.
  - You are about to drop the column `legalTermVersion` on the `api_clients` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "api_clients" DROP COLUMN "apiToken",
DROP COLUMN "legalTermVersion";

-- CreateTable
CREATE TABLE "users" (
    "did" TEXT NOT NULL PRIMARY KEY,
    "legalTermVersion" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acceptedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- AddForeignKey
ALTER TABLE "api_clients" ADD CONSTRAINT "api_clients_did_fkey" FOREIGN KEY ("did") REFERENCES "users"("did") ON DELETE RESTRICT ON UPDATE CASCADE;

-- GrantAccess
GRANT INSERT, SELECT, UPDATE, DELETE ON "verifier"."users" TO verifier;

DO
$$
    BEGIN
        IF EXISTS(
              SELECT *
              FROM pg_catalog.pg_user
              WHERE usename = 'pi_ro_dbuser')
        THEN
            GRANT SELECT ON "verifier"."users" TO pi_ro_dbuser;
        END IF;
    END
$$;
