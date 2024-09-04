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

afterEach(async () => {
  await prisma.user.deleteMany({
    where: {
      did: TEST_DID
    }
  })
})

test("POST /api/v1/users creates a user with a given DID", async () => {
  const { statusCode, body } = await request(app).post("/api/v1/users").send({
    did: TEST_DID
  })

  expect(statusCode).toBe(200)
  expect(body.did).toEqual(TEST_DID)
})

test("POST /api/v1/users cannot create an API client with non did web type", async () => {
  const NON_DID_WEB =
    "did:key:zQ3shUYeuHupkTB38kqqSqzhyqXix4MLjJ8xbydrdQBbruqKU"

  const { statusCode } = await request(app).post("/api/v1/users").send({
    did: NON_DID_WEB
  })
  expect(statusCode).toBe(400)
})

test("POST /api/v1/users cannot a user with a duplicate DID", async () => {
  await request(app).post("/api/v1/users").send({
    did: TEST_DID
  })

  const { statusCode } = await request(app).post("/api/v1/users").send({
    did: TEST_DID
  })

  expect(statusCode).toBe(400)
})

test("POST /api/v1/users cannot a user with an invalid DID", async () => {
  const didWithSpace = "did:web:circle    .com"
  let res = await request(app).post("/api/v1/users").send({
    did: didWithSpace
  })
  expect(res.statusCode).toBe(400)

  const didWithSpecialChar = "did:web:circle%23.com"
  res = await request(app).post("/api/v1/users").send({
    did: didWithSpecialChar
  })

  expect(res.statusCode).toBe(400)

  const didLongerThan253Char =
    "thisisaverylongthisisaverylongthisisaverylongthisisaverylongthisisaverylongthisisaverylongthisisaverylongthisisaverylongthisisaverylongthisisaverylongthisisaverylongthisisaverylongthisisaverylongthisisaverylongthisisaverylongaverylongaverylongdomainname.com"
  res = await request(app).post("/api/v1/users").send({
    did: didLongerThan253Char
  })

  expect(res.statusCode).toBe(400)
})
