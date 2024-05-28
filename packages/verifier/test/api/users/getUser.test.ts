/**
 * Copyright 2024 Circle Internet Financial, LTD.  All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

import request from "supertest"

import { app } from "../../../src/app"
import prisma from "../../../src/lib/database/prisma"

const TEST_DID = "did:web:example.com"

afterEach(async () => {
  await prisma.user.deleteMany({
    where: {
      did: TEST_DID
    }
  })
})

test("GET /api/v1/users gets a user with a given DID", async () => {
  await request(app).post("/api/v1/users").send({
    did: TEST_DID
  })
  const { statusCode, body } = await request(app).get(
    `/api/v1/users/${TEST_DID}`
  )

  expect(statusCode).toBe(200)
  expect(body.did).toEqual(TEST_DID)
  expect(body.hasAcceptedLegalTerms).toBeTruthy()
})

test("GET /api/v1/users returns 404 for user not found", async () => {
  const { statusCode } = await request(app).get(`/api/v1/users/${TEST_DID}`)
  expect(statusCode).toBe(404)
})
