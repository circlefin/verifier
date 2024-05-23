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

import { randomBytes } from "crypto"

import {
  createApiClient,
  findApiClient,
  findActiveApiClients,
  updateApiClient
} from "../../../src/lib/database/apiClient"
import prisma from "../../../src/lib/database/prisma"

const TEST_DID = "did:web:example.com"
const DEFAULT_API_TOKEN = randomBytes(16).toString("hex")
const DEFALUT_LEGAL_TERM_VERSION = 1
const DEFAULT_EXP_IN_SEC = 3600
const DEFAULT_CREATE_PARAM = {
  did: TEST_DID,
  apiToken: DEFAULT_API_TOKEN,
  legalTermVersion: DEFALUT_LEGAL_TERM_VERSION,
  expiresInSeconds: DEFAULT_EXP_IN_SEC
}

beforeAll(async () => {
  await prisma.user.create({
    data: {
      did: TEST_DID,
      legalTermVersion: DEFALUT_LEGAL_TERM_VERSION
    }
  })
})

afterAll(async () => {
  await prisma.user.deleteMany({
    where: {
      did: TEST_DID
    }
  })
})

test("createApiClient() creates a new api client", async () => {
  const apiClient = await createApiClient(DEFAULT_CREATE_PARAM)

  expect(apiClient.did).toEqual(TEST_DID)
  expect(apiClient.expiresInSeconds).toEqual(DEFAULT_EXP_IN_SEC)
  expect(apiClient.createdAt).toBeDefined()
  expect(apiClient.revokedAt).toBeNull()

  await prisma.apiClient.delete({
    where: {
      id: apiClient.id
    }
  })
})

test("findApiClient() returns the requested client with the right id", async () => {
  const { id } = await createApiClient(DEFAULT_CREATE_PARAM)

  const found = await findApiClient({ id })

  expect(found.did).toEqual(TEST_DID)

  await prisma.apiClient.delete({
    where: {
      id
    }
  })
})

test("findApiClient() throw an error if client does not exist", async () => {
  await expect(
    findApiClient({
      id: "0192220b-528e-4adf-9567-4f46388d60e4"
    })
  ).rejects.toThrow()
})

test("findActiveApiClient() returns a client that has not been revoked", async () => {
  const { id } = await createApiClient(DEFAULT_CREATE_PARAM)

  const apiClients = await findActiveApiClients({
    did: TEST_DID
  })

  expect(apiClients).toHaveLength(1)
  apiClients && expect(apiClients[0].did).toEqual(TEST_DID)

  await prisma.apiClient.delete({
    where: {
      id
    }
  })
})

test("updateApiClient updates the client with given data", async () => {
  const { id, revokedAt } = await createApiClient(DEFAULT_CREATE_PARAM)

  expect(revokedAt).toBeNull()

  const revokedDate = new Date()
  const updatedClient = await updateApiClient({
    id,
    data: {
      revokedAt: revokedDate
    }
  })

  expect(updatedClient?.did).toEqual(TEST_DID)
  expect(updatedClient?.revokedAt).toEqual(revokedDate)

  await prisma.apiClient.delete({
    where: {
      id
    }
  })
})
