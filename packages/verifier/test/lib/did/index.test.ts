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

import nock from "nock"

import { didResolver } from "../../../src/lib/did"
import { didFactory } from "../../factories/did"

test("didResolver successfully resolves EdDSA did:key documents", async () => {
  const { didDocument } = await didFactory("ed25519")
  const subject = didDocument.id

  const result = await didResolver.resolve(subject)
  expect(result.didDocument).toBeDefined()
  expect(result.didDocument?.id).toEqual(subject)
  expect(result.didDocument?.verificationMethod).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        type: "Ed25519VerificationKey2018",
        controller: subject
      })
    ])
  )
})

test("didResolver successfully resolves ES256K did:key documents", async () => {
  const { didDocument } = await didFactory("secp256k1")
  const subject = didDocument.id

  const result = await didResolver.resolve(subject)
  expect(result.didDocument).toBeDefined()
  expect(result.didDocument?.id).toEqual(subject)
  expect(result.didDocument?.verificationMethod).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        type: "EcdsaSecp256k1VerificationKey2019",
        controller: subject
      })
    ])
  )
})

test("didResolver successfully resolves EdDSA did:web documents", async () => {
  const didDocument = {
    "@context": "https://w3id.org/did/v1",
    id: "did:web:example.com",
    publicKey: [
      {
        id: "did:web:example.com#owner",
        type: "Ed25519VerificationKey2018",
        controller: "did:web:example.com",
        publicKeyBase58: "NEyqo9lJoKoKLnAUxu4lthdfrhT2_SNA9GuDqb9WWsU"
      }
    ],
    authentication: [
      {
        type: "Ed25519VerificationKey2018",
        publicKey: "did:web:example.com#owner"
      }
    ]
  }

  nock("https://example.com")
    .get("/.well-known/did.json")
    .reply(200, JSON.stringify(didDocument))

  const result = await didResolver.resolve("did:web:example.com")
  expect(result.didDocument).toEqual(didDocument)
  expect(result.didResolutionMetadata).toEqual({
    contentType: "application/did+ld+json"
  })
})

test("didResolver successfully resolves ES256K did:web documents", async () => {
  const didDocument = {
    "@context": "https://w3id.org/did/v1",
    id: "did:web:example.com",
    publicKey: [
      {
        id: "did:web:example.com#owner",
        type: "EcdsaSecp256k1VerificationKey2019",
        controller: "did:web:example.com",
        publicKeyBase58: "cikKiv4u7gSoGamkGqLTgNLZCBRm995aof6JxTtXFBwt"
      }
    ],
    authentication: [
      {
        type: "EcdsaSecp256k1VerificationKey2019",
        publicKey: "did:web:example.com#owner"
      }
    ]
  }

  nock("https://example.com")
    .get("/.well-known/did.json")
    .reply(200, JSON.stringify(didDocument))

  const result = await didResolver.resolve("did:web:example.com")
  expect(result.didDocument).toEqual(didDocument)
  expect(result.didResolutionMetadata).toEqual({
    contentType: "application/did+ld+json"
  })
})

test("didResolver fails to resolve invalid did:web documents", async () => {
  const didDocument = {
    invalid: "document"
  }

  nock("https://example.com")
    .get("/.well-known/did.json")
    .reply(200, JSON.stringify(didDocument))

  const result = await didResolver.resolve("did:web:example.com")
  expect(result).toBeTruthy()
  expect(result.didDocument).toEqual(didDocument)
  expect(result.didResolutionMetadata).toEqual({
    error: "notFound",
    message: "resolver_error: DID document id does not match requested did"
  })
})

test("didResolver fails resolving a malformed did:key", async () => {
  const subject = "did:key:z6MkmrNEvz4N9iKbHZaFnnBKc61sKBLbbugi4MWsPMfKPmZRaa"

  const result = await didResolver.resolve(subject)
  expect(result.didDocument).toBeNull()
  expect(result.didResolutionMetadata).toEqual({
    error: "notFound",
    message:
      "resolver_error: Unsupported fingerprint type: z6MkmrNEvz4N9iKbHZaFnnBKc61sKBLbbugi4MWsPMfKPmZRaa"
  })
})

test("didResolver fails if given an invalid document", async () => {
  const result = await didResolver.resolve("invalid:did")
  expect(result.didDocument).toBeNull()
  expect(result.didResolutionMetadata).toEqual({
    error: "invalidDid"
  })
})
