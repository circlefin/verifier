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

import {
  decodeVerifiableCredential,
  decodeVerifiablePresentation,
  verifyVerifiablePresentation
} from "../../src/lib/coder"
import { verifiableCredentialFactory } from "../factories/verifiable-credential"
import { verifiablePresentationFactory } from "../factories/verifiable-presentation"

test("decodeVerifiablePresentation decodes a valid JWT Verifiable Presentation", async () => {
  const vp = await verifiablePresentationFactory()

  const result = await decodeVerifiablePresentation(vp)

  expect(result.type).toEqual([
    "VerifiablePresentation",
    "CredentialFulfillment"
  ])
  expect(result.verifiableCredential?.[0].type).toEqual([
    "VerifiableCredential",
    "KYBPAMLAttestation"
  ])
})

test("verifyVerifiablePresentation decodes a valid plaintext Verifiable Presentation", async () => {
  const vp = await verifiablePresentationFactory()

  const result = verifyVerifiablePresentation(vp)

  expect(result.type).toEqual([
    "VerifiablePresentation",
    "CredentialFulfillment"
  ])
  expect(result.verifiableCredential?.[0].type).toEqual([
    "VerifiableCredential",
    "KYBPAMLAttestation"
  ])
})

test("decodeVerifiablePresentation throws when given an invalid Verifiable Presentation", async () => {
  await expect(decodeVerifiablePresentation("blah")).rejects.toThrow(
    "Input isn't a valid Verifiable Presentation"
  )
})

test("decodeVerifiableCredentials decodes a valid Verifiable Credential", async () => {
  const vc = await verifiableCredentialFactory()

  const result = await decodeVerifiableCredential(vc)

  expect(result.type).toEqual(["VerifiableCredential", "KYBPAMLAttestation"])
})

test("decodeVerifiableCredentials throws when given an invalid credential", async () => {
  await expect(decodeVerifiableCredential("blah")).rejects.toThrow(
    "Input isn't a valid Verifiable Credential"
  )
})
