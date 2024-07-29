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

import { expect, jest, test } from "@jest/globals"
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

test("POST /api/v1/apiClients/revoke cannot revoke without auth", async () => {
  const { statusCode } = await request(app).patch("/api/v1/apiClients").send()

  expect(statusCode).toBe(401)
})

test("POST /api/v1/apiClients/revoke cannot revoke without an api client", async () => {
  const { statusCode } = await request(app).patch("/api/v1/apiClients").send()

  expect(statusCode).toBe(401)
})

test("POST /api/v1/apiClients/revoke cannot revoke without the valid api token", async () => {
  const { body } = await request(app).post("/api/v1/apiClients").send({
    did: TEST_DID
  })

  const { statusCode } = await request(app)
    .patch("/api/v1/apiClients")
    .set("X-API-Key", "123")
    .send()

  expect(statusCode).toBe(401)

  await prisma.apiClient.delete({
    where: {
      id: body.id
    }
  })
})

test("POST /api/v1/apiClients/revoke cannot revoke with the expired api token", async () => {
  const {
    body: { id, createdAt }
  } = await request(app).post("/api/v1/apiClients").send({
    did: TEST_DID
  })

  // Change time to 500ms after expiry date
  const expiredIn = 2147483647 * 1000
  const dateNowSpy = jest
    .spyOn(Date, "now")
    .mockImplementation(
      () => new Date(createdAt as string).getTime() + expiredIn + 500
    )

  const { statusCode } = await request(app)
    .patch("/api/v1/apiClients")
    .set("X-API-Key", id as string)
    .send({
      id,
      revokedReason: "test"
    })

  expect(statusCode).toBe(401)

  dateNowSpy.mockRestore()

  await prisma.apiClient.delete({
    where: {
      id
    }
  })
})

test("POST /api/v1/apiClients/revoke revokes api client successfully", async () => {
  const {
    body: { id }
  } = await request(app).post("/api/v1/apiClients").send({
    did: TEST_DID
  })

  const revokedReason = "Rotate secret"
  const { statusCode, body } = await request(app)
    .patch("/api/v1/apiClients")
    .set("X-API-Key", id as string)
    .send({
      revokedReason
    })

  expect(statusCode).toBe(200)
  expect(body.id).toEqual(id)
  expect(body.revokedAt).toBeDefined()
  expect(body.revokedReason).toEqual(revokedReason)
  expect(body.revokedBy).toBeDefined()

  await prisma.apiClient.delete({
    where: {
      id
    }
  })
})

test("POST /api/v1/apiClients/revoke cannot revoke an api client twice", async () => {
  const {
    body: { id }
  } = await request(app).post("/api/v1/apiClients").send({
    did: TEST_DID
  })

  const revokedReason = "Rotate secret"
  const res1 = await request(app)
    .patch("/api/v1/apiClients")
    .set("X-API-Key", id as string)
    .send({
      revokedReason
    })

  expect(res1.statusCode).toBe(200)

  const res2 = await request(app)
    .patch("/api/v1/apiClients")
    .set("X-API-Key", id as string)
    .send({
      revokedReason
    })

  expect(res2.statusCode).toBe(401)

  await prisma.apiClient.delete({
    where: {
      id
    }
  })
})
