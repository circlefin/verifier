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
import { verificationFactory } from "../../factories/verification"

test("GET /api/v1/verifications/:id/status responds with the status and a verification result", async () => {
  const verification = await verificationFactory({
    status: "approved",
    verificationResult: { foo: "bar" }
  })

  const { statusCode, body } = await request(app).get(
    `/api/v1/verifications/${verification.id}/status`
  )

  expect(statusCode).toBe(200)
  expect(body).toMatchObject({
    status: "approved",
    verificationResult: verification.verificationResult
  })
})

test("GET /api/v1/verifications/:id/status responds with a failure status", async () => {
  const verification = await verificationFactory({
    status: "rejected",
    statusDetail: "Credential issued by untrusted issuer"
  })

  const { statusCode, body } = await request(app).get(
    `/api/v1/verifications/${verification.id}/status`
  )

  expect(statusCode).toBe(400)
  expect(body).toMatchObject({
    status: "rejected",
    message: "Credential issued by untrusted issuer"
  })
})

test("GET /api/v1/verifications/:id/status responds with a pending status", async () => {
  const verification = await verificationFactory({
    status: "created"
  })

  const { statusCode, body } = await request(app).get(
    `/api/v1/verifications/${verification.id}/status`
  )

  expect(statusCode).toBe(200)
  expect(body).toMatchObject({
    status: "created"
  })
})

test("GET /api/v1/verifications/:id/status responds with a 404 if given an invalid id", async () => {
  const verifId = "invalid-id"
  const { statusCode, body } = await request(app).get(
    `/api/v1/verifications/${verifId}/status`
  )
  expect(statusCode).toBe(404)
  expect(body).toEqual({
    status: 404,
    errors: [{ message: `Verification not found for ${verifId}` }]
  })
})
