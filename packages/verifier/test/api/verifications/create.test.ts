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

import { _exportedForUnitTests } from "../../../src/api/verifications/create"
import { app } from "../../../src/app"

test("POST /api/v1/verifications creates a verification for Ethereum and responds with a 201", async () => {
  const { statusCode, body } = await request(app)
    .post("/api/v1/verifications")
    .send({
      network: "ethereum",
      subject: "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266",
      chainId: 1337,
      registryAddress: "0x0000000000000000000000000000000000000000",
      name: "VerificationRegistry",
      version: "1"
    })

  expect(statusCode).toBe(201)
  expect(body).toMatchObject({
    challengeTokenUrl: expect.stringMatching(`(.*)/verifications/(.*)$`)
  })
})

test("POST /api/v1/verifications creates a verification for Solana and responds with a 400", async () => {
  const { statusCode, body } = await request(app)
    .post("/api/v1/verifications")
    .send({
      network: "solana",
      subject: "AWPiwzy1yY1gMbM5zEvVYG6qDCLjrwAojDMrk3ajbwWj",
      chainId: "localnet",
      name: "VerificationRegistry",
      version: "1"
    })

  expect(statusCode).toBe(400)
  expect(body).toEqual({
    status: 400,
    errors: [{ message: "Unsupported network: solana" }]
  })
})

test("POST /api/v1/verifications returns an error if no subject is provided", async () => {
  const { statusCode, body } = await request(app)
    .post("/api/v1/verifications")
    .send({
      network: "ethereum"
    })

  expect(statusCode).toBe(400)
  expect(body).toEqual({
    status: 400,
    errors: [{ message: "subject is required" }]
  })
})

test("POST /api/v1/verifications returns an error if no network is provided", async () => {
  const { statusCode, body } = await request(app)
    .post("/api/v1/verifications")
    .send({ subject: "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266" })

  expect(statusCode).toBe(400)
  expect(body).toEqual({
    status: 400,
    errors: [{ message: "network is required" }]
  })
})

test("POST /api/v1/verifications fails if an unsupported network is given", async () => {
  const { statusCode, body } = await request(app)
    .post("/api/v1/verifications")
    .send({
      subject: "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266",
      network: "bitcoin"
    })

  expect(statusCode).toBe(400)
  expect(body).toEqual({
    status: 400,
    errors: [{ message: `Unsupported network: bitcoin` }]
  })
})

test("POST /api/v1/verifications fails if given an invalid subject address for ethereum", async () => {
  const { statusCode, body } = await request(app)
    .post("/api/v1/verifications")
    .send({
      subject: "AWPiwzy1yY1gMbM5zEvVYG6qDCLjrwAojDMrk3ajbwWj", // Solana Address
      network: "ethereum"
    })

  expect(statusCode).toBe(400)
  expect(body).toEqual({
    status: 400,
    errors: [{ message: `Invalid subject address for ethereum` }]
  })
})

test("fails if given an invalid subject address for solana", () => {
  const subject = "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266" // Ethereum Address
  const network = "solana"

  expect(() =>
    _exportedForUnitTests.validateSubjectAddress(network, subject)
  ).toThrow("Invalid subject address for solana")
})

test("POST /api/v1/verifications fails if an invalid chainId is provided for ethereum", async () => {
  const { statusCode, body } = await request(app)
    .post("/api/v1/verifications")
    .send({
      subject: "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266",
      network: "ethereum",
      chainId: "not a number"
    })

  expect(statusCode).toBe(400)
  expect(body).toEqual({
    status: 400,
    errors: [{ message: "chainId must be a number" }]
  })
})

test("POST /api/v1/verifications fails if a negative chainId is provided for ethereum", async () => {
  const { statusCode, body } = await request(app)
    .post("/api/v1/verifications")
    .send({
      subject: "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266",
      network: "ethereum",
      chainId: -1
    })

  expect(statusCode).toBe(400)
  expect(body).toEqual({
    status: 400,
    errors: [{ message: "chainId must be greater than 0" }]
  })
})

test("fails if an invalid chainId is provided for solana", () => {
  const network = "solana"
  let chainId: string | number

  chainId = "fakenet"
  expect(() => _exportedForUnitTests.validateChainId(network, chainId)).toThrow(
    "Invalid chainId"
  )

  chainId = 1
  expect(() => _exportedForUnitTests.validateChainId(network, chainId)).toThrow(
    "chainId must be a string"
  )
})
