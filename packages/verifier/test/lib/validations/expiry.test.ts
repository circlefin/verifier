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

import { assertNotExpired } from "../../../src/lib/validations/expiry"
import { decodedVerifiableCredentialFactory } from "../../factories/verifiable-credential"

test("assertNotExpired() passes if the credential does not have an expiry", async () => {
  const vc = await decodedVerifiableCredentialFactory()

  expect(() => {
    assertNotExpired(vc)
  }).not.toThrow()
})

test("assertNotExpired() passes if the credential expires in the future", async () => {
  const vc = await decodedVerifiableCredentialFactory({
    expirationDate: new Date(Date.now() + 10000)
  })

  expect(() => {
    assertNotExpired(vc)
  }).not.toThrow()
})

test("assertNotExpired() throws when the credential is expired", async () => {
  const vc = await decodedVerifiableCredentialFactory({
    expirationDate: new Date(Date.now() - 10000)
  })

  expect(() => {
    assertNotExpired(vc)
  }).toThrow("Credential has expired.")
})
