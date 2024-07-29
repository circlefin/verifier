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

import { BitBuffer } from "bit-buffers"
import { createVerifiableCredentialJwt, CredentialPayload } from "did-jwt-vc"

import { decodeVerifiableCredential } from "../../src/lib/coder"
import {
  EncodedRevocationListCredential,
  RevocationList,
  StatusList2021Entry,
  RevocationListCredential
} from "../../src/types/credentials"

import { signerFactory } from "./did"

type RevocationListCredentialFactoryOptions = {
  /**
   * The status list (defaults to [])
   */
  statusList?: number[]
  /**
   * The URL for loading the status list
   */
  url?: string
}

export const revocationStatusListFactory = (
  index: number | string = "42"
): StatusList2021Entry => {
  return {
    id: `https://example.com/revocation-list#${index}`,
    type: "StatusList2021Entry",
    statusListIndex: index.toString(),
    statusListCredential: "https://example.com/revocation-list"
  }
}

export const encodedRevocationListCredentialFactory = async ({
  statusList,
  url
}: RevocationListCredentialFactoryOptions = {}): Promise<EncodedRevocationListCredential> => {
  const signer = await signerFactory()
  const encodedList = BitBuffer.fromIndexArray(statusList ?? []).toBitstring()
  const statusListUrl = url ?? "https://example.com/revocation-list"

  const vcPayload: RevocationList<CredentialPayload> = {
    "@context": [
      "https://www.w3.org/2018/credentials/v1",
      "https://w3id.org/vc-status-list-2021/v1"
    ],
    id: statusListUrl,
    type: ["VerifiableCredential", "StatusList2021Credential"],
    issuer: signer.did,
    issuanceDate: new Date(),
    credentialSubject: {
      id: `${statusListUrl}#list`,
      type: "StatusList2021Entry",
      encodedList
    }
  }

  return createVerifiableCredentialJwt(vcPayload as CredentialPayload, signer)
}

export const revocationListCredentialFactory = async (
  opts: RevocationListCredentialFactoryOptions = {}
): Promise<RevocationListCredential> => {
  const vcJwt = await encodedRevocationListCredentialFactory(opts)

  return decodeVerifiableCredential(vcJwt) as Promise<RevocationListCredential>
}
