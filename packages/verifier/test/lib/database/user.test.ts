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

import prisma from "../../../src/lib/database/prisma"
import { getUser, createUser } from "../../../src/lib/database/user"

const TEST_DID = "did:web:example.com"
const TEST_LEGAL_TERM_VERSION = 1

afterEach(async () => {
  await prisma.user.deleteMany({
    where: {
      did: TEST_DID
    }
  })
})

test("createUser() creates a new user", async () => {
  const user = await createUser({
    did: TEST_DID,
    legalTermVersion: TEST_LEGAL_TERM_VERSION
  })

  expect(user.did).toEqual(TEST_DID)
  expect(user.legalTermVersion).toEqual(TEST_LEGAL_TERM_VERSION)
  expect(user.createdAt).toBeDefined()
  expect(user.acceptedAt).toBeDefined()
})

test("getUser() gets the user", async () => {
  await createUser({
    did: TEST_DID,
    legalTermVersion: TEST_LEGAL_TERM_VERSION
  })

  const user = await getUser({
    did: TEST_DID
  })

  expect(user.did).toEqual(TEST_DID)
  expect(user.legalTermVersion).toEqual(TEST_LEGAL_TERM_VERSION)
  expect(user.createdAt).toBeDefined()
  expect(user.acceptedAt).toBeDefined()
})

test("getUser() throws if user not found", async () => {
  await expect(getUser({ did: TEST_DID })).rejects.toThrow()
})
