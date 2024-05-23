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

import {
  assertHolderIsSubject,
  assertCredentialSubjectMatchesRequest
} from "../../../src/lib/validations/subject"
import { decodedVerifiableCredentialFactory } from "../../factories/verifiable-credential"

test("assertHolderIsSubject() passes if the credential subject matches the holder", async () => {
  const vc = await decodedVerifiableCredentialFactory()
  const vpSigner = vc.credentialSubject.id as string

  expect(() => {
    assertHolderIsSubject(vpSigner, vc)
  }).not.toThrow()
})

test("assertHolderIsSubject() throws when the credential subject does not match the holder", async () => {
  const vc = await decodedVerifiableCredentialFactory()
  const vpSigner = vc.issuer.id

  expect(() => {
    assertHolderIsSubject(vpSigner, vc)
  }).toThrow("Presentation is not signed by the subject")
})

test("assertRequestSubjectIsCredentialSubject() passes when the credential subject matches the verification request subject", async () => {
  const ethAddress = "0x5922aee21da29814adc6b33cdf9920b72963a110"
  const vcSubjectDid = `did:pkh:eip155:1:${ethAddress}`

  await expect(
    assertCredentialSubjectMatchesRequest(ethAddress, vcSubjectDid)
  ).resolves.not.toThrow()
})

test("assertRequestSubjectIsCredentialSubject() passes when the credential subject matches the verification request subject case insensitively", async () => {
  const ethAddress = "0x5922aee21da29814adc6b33cdf9920b72963a110"
  const vcSubjectDid = `did:pkh:eip155:1:${ethAddress.toLowerCase()}`

  await expect(
    assertCredentialSubjectMatchesRequest(ethAddress.toUpperCase(), vcSubjectDid)
  ).resolves.not.toThrow()
})

test("assertRequestSubjectIsCredentialSubject() throws when the credential subject does not matches the verification request subject", async () => {
  const ethAddress = "0x5922aee21da29814adc6b33cdf9920b72963a110"
  const vcSubjectDid = `did:pkh:eip155:1:${ethAddress}`

  await expect(
    assertCredentialSubjectMatchesRequest("blah", vcSubjectDid)
  ).rejects.toThrow(
    `Credential subject does not match the subject in the verification request. ${ethAddress} is not equal to blah`
  )
})

test("assertRequestSubjectIsCredentialSubject() throws when the credential subject is undefined", async () => {
  await expect(
    assertCredentialSubjectMatchesRequest("blah", undefined)
  ).rejects.toThrow("Encountered invalid credential. Subject ID not found.")
})

test("assertRequestSubjectIsCredentialSubject() throws when the credential subject format is bad", async () => {
  let vcSubjectDid: string

  // bad scheme
  vcSubjectDid =
    "foo_id:pkh:eip155:1:0x5922aee21da29814adc6b33cdf9920b72963a110"
  await expect(
    assertCredentialSubjectMatchesRequest("blah", vcSubjectDid)
  ).rejects.toThrow(`Failed to parse did ${vcSubjectDid}`)

  // bad method
  vcSubjectDid =
    "did:foo_pkh:eip155:1:0x5922aee21da29814adc6b33cdf9920b72963a110"
  await expect(
    assertCredentialSubjectMatchesRequest("blah", vcSubjectDid)
  ).rejects.toThrow(`Failed to parse did ${vcSubjectDid}`)

  // bad network ID
  vcSubjectDid = "did:pkh:eip155:@:0x5922aee21da29814adc6b33cdf9920b72963a110"
  await expect(
    assertCredentialSubjectMatchesRequest("blah", vcSubjectDid)
  ).rejects.toThrow(`Failed to parse did ${vcSubjectDid}`)

  // bad address character
  vcSubjectDid = "did:pkh:eip155:2:0x5922aee21da29814adc6b33cdf9920b72963a11#"
  await expect(
    assertCredentialSubjectMatchesRequest("blah", vcSubjectDid)
  ).rejects.toThrow(`Failed to parse did ${vcSubjectDid}`)

  // bad address prefix
  vcSubjectDid = "did:pkh:eip155:2:0y5922aee21da29814adc6b33cdf9920b72963a110"
  await expect(
    assertCredentialSubjectMatchesRequest("blah", vcSubjectDid)
  ).rejects.toThrow(`Failed to parse did ${vcSubjectDid}`)
})
