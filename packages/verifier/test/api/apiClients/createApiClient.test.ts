/**
 * Copyright 2024 Circle Internet Group, Inc.  All rights reserved.
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

beforeAll(async () => {
  await request(app).post("/api/v1/users").send({
    did: TEST_DID
  })
})

afterAll(async () => {
  await prisma.user.deleteMany({
    where: {
      did: TEST_DID
    }
  })
})

test("POST /api/v1/apiClients creates an API client with user", async () => {
  const { statusCode, body } = await request(app)
    .post("/api/v1/apiClients")
    .send({
      did: TEST_DID
    })

  expect(statusCode).toBe(200)
  expect(body.id).toBeDefined()
  expect(body.did).toEqual(TEST_DID)

  await prisma.apiClient.deleteMany({
    where: {
      user: {
        did: TEST_DID
      }
    }
  })
})

test("POST /api/v1/apiClients cannot create API client without user", async () => {
  const { statusCode } = await request(app).post("/api/v1/apiClients").send()

  expect(statusCode).toBe(400)
})
