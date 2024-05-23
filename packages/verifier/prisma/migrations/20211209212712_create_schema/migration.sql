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

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- CreateTable
CREATE TABLE "verifications" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "challenge" UUID NOT NULL DEFAULT gen_random_uuid(),
    "network" TEXT NOT NULL,
    "chain_id" INTEGER NOT NULL DEFAULT 1,
    "registry_address" TEXT,
    "subject" TEXT NOT NULL,
    "presentation_definition" JSONB NOT NULL,
    "credential_submission" JSONB,
    "verification_result" JSONB,
    "signature" TEXT,
    "status" TEXT NOT NULL DEFAULT E'created',
    "status_detail" TEXT,
    "offered_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "submitted_at" TIMESTAMP(3),
    "verified_at" TIMESTAMP(3),

    CONSTRAINT "verifications_pkey" PRIMARY KEY ("id")
);
