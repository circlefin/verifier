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

import nock, { disableNetConnect, enableNetConnect } from "nock"

import {
  assertNotRevoked,
  isBitRevoked,
  statusListDomainMapFunc,
  getStatusListCredentialUrl
} from "../../../src/lib/validations/revocation"
import {
  encodedRevocationListCredentialFactory,
  revocationListCredentialFactory,
  revocationStatusListFactory
} from "../../factories/revocationList"
import { decodedVerifiableCredentialFactory } from "../../factories/verifiable-credential"

test("assertNotRevoked() passes if the credential is not revocable", async () => {
  const vc = await decodedVerifiableCredentialFactory()

  await expect(assertNotRevoked(vc)).resolves.not.toThrow()
})

test("assertNotRevoked() passes if the credential is not yet revoked", async () => {
  const credentialStatus = revocationStatusListFactory()
  const vc = await decodedVerifiableCredentialFactory({ credentialStatus })
  const revocationList = await encodedRevocationListCredentialFactory()

  nock("https://example.com").get("/revocation-list").reply(200, revocationList)

  await expect(assertNotRevoked(vc)).resolves.not.toThrow()
})

test("assertNotRevoked() throws when the credential has been revoked", async () => {
  const credentialStatus = revocationStatusListFactory(42)
  const vc = await decodedVerifiableCredentialFactory({ credentialStatus })
  const revocationList = await encodedRevocationListCredentialFactory({
    statusList: [42]
  })

  nock("https://example.com").get("/revocation-list").reply(200, revocationList)

  await expect(assertNotRevoked(vc)).rejects.toThrow()
})

test("assertNotRevoked() allows passing a pre-fetched status list", async () => {
  const credentialStatus = revocationStatusListFactory(1)
  const vc = await decodedVerifiableCredentialFactory({ credentialStatus })
  const revocationList = await revocationListCredentialFactory({
    statusList: [1]
  })

  await expect(assertNotRevoked(vc, revocationList)).rejects.toThrow()
})

test("assertNotRevoked() throws if the revocation list is unavailable", async () => {
  const credentialStatus = revocationStatusListFactory(1)
  const vc = await decodedVerifiableCredentialFactory({ credentialStatus })

  nock("https://example.com").get("/revocation-list").reply(404)

  await expect(assertNotRevoked(vc)).rejects.toThrow()
})

test("assertNotRevoked() throws when a network error prevents the revocation list from being loaded", async () => {
  const credentialStatus = revocationStatusListFactory(42)
  const vc = await decodedVerifiableCredentialFactory({ credentialStatus })

  disableNetConnect()

  await expect(assertNotRevoked(vc)).rejects.toThrow()

  enableNetConnect()
})

test("assertNotRevoked() throws when the revocation list is invalid", async () => {
  const credentialStatus = revocationStatusListFactory(42)
  const vc = await decodedVerifiableCredentialFactory({ credentialStatus })
  const revocationList = "invalid"

  nock("https://example.com").get("/revocation-list").reply(200, revocationList)

  await expect(assertNotRevoked(vc)).rejects.toThrow()
})

test("isBitRevoked() checks the revocation bit", () => {
  const exampleStatusList =
    "eJztwUERAAAIA6CdKeyfdLbwAyRnNgAAAAAAAAAAAAAAAAAAAMCfAr/AABs="
  expect(isBitRevoked(exampleStatusList, 934)).toEqual(false)
  expect(isBitRevoked(exampleStatusList, 51)).toEqual(true)

  const bitMaskSize = 16 * 1024 * 8
  expect(isBitRevoked(exampleStatusList, bitMaskSize - 1)).toEqual(false)
})

test("statusListDomainMapFunc() returns a domain map or empty", () => {
  const statusListDomainMapStr =
    "issuer-smokebox.circle.com=verity-issuer-smokebox-verity-issuer.verity.svc.cluster.local:10050,issuer-staging.circle.com=verity-issuer-stg-verity-issuer.verity.svc.cluster.local:10050"
  const statusListDomainMap = statusListDomainMapFunc(statusListDomainMapStr)
  expect(statusListDomainMap["issuer-smokebox.circle.com"]).toEqual(
    "verity-issuer-smokebox-verity-issuer.verity.svc.cluster.local:10050"
  )
  expect(statusListDomainMap["issuer-staging.circle.com"]).toEqual(
    "verity-issuer-stg-verity-issuer.verity.svc.cluster.local:10050"
  )

  const emptyMap = statusListDomainMapFunc("")
  expect(emptyMap).toEqual({})
})

test("getStatusListCredentialUrl() modify the domain name if found and select agent", () => {
  const statusListDomainMap = statusListDomainMapFunc(
    "issuer-smokebox.circle.com=verity-issuer-smokebox-verity-issuer.verity.svc.cluster.local:10050"
  )
  const [urlAfter, agent1] = getStatusListCredentialUrl(
    "https://issuer-smokebox.circle.com/api/v1/issuance/status/0",
    statusListDomainMap
  )
  expect(urlAfter).toEqual(
    "https://verity-issuer-smokebox-verity-issuer.verity.svc.cluster.local:10050/api/v1/issuance/status/0"
  )
  expect(agent1.options.rejectUnauthorized).toBeFalsy()

  const [urlNoMatch, agent2] = getStatusListCredentialUrl(
    "https://issuer.circle.com/api/v1/issuance/status/0",
    statusListDomainMap
  )
  expect(urlNoMatch).toEqual(
    "https://issuer.circle.com/api/v1/issuance/status/0"
  )
  expect(agent2.options.rejectUnauthorized).toBeTruthy()

  const [urlUntouched, agent3] = getStatusListCredentialUrl(
    "https://issuer.circle.com/api/v1/issuance/status/0",
    {}
  )
  expect(urlUntouched).toEqual(
    "https://issuer.circle.com/api/v1/issuance/status/0"
  )
  expect(agent3.options.rejectUnauthorized).toBeTruthy()
})
