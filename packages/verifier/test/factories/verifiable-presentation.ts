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
  createVerifiablePresentationJwt,
  Issuer,
  JwtPresentationPayload
} from "did-jwt-vc"
import { v4 as uuidv4 } from "uuid"

import { decodeVerifiablePresentation } from "../../src/lib/coder"

import { DID_PKH, signerFactory } from "./did"
import { verifiableCredentialFactory } from "./verifiable-credential"

type Opts = {
  /**
   * The holder of the Verifiable Presentation. This *should* be the same as the
   * subject of the Verifiable Credential. If not, the verification process will
   * fail.
   */
  holder?: Issuer
  /**
   * The subject DID of the Verifiable Presentation. This *should* be the same
   * as the holder's DID. If not, the verification process will fail.
   */
  subject?: string
  /**
   * A pre-generated Verifiable Credential. A `null` value will cause the
   * Verifiable Presentation to be generated without any verifiable credentials.
   */
  vcJWT?: string | string[] | null
  /**
   * The issuer of the Verifiable Credential
   */
  vcIssuer?: Issuer
  /**
   * The challenge string for the Verifiable Presentation
   */
  challenge?: string
  /**
   * Additional descriptorMap field
   */
  additionalDescriptorMapFields?: [Record<string, unknown>]
}

export const verifiablePresentationJsonFactory = (
  holder: Issuer,
  cwJwt: string | string[],
  opts: Opts
): JwtPresentationPayload => {
  return {
    sub: holder.did,
    vp: {
      "@context": ["https://www.w3.org/2018/credentials/v1"],
      type: ["VerifiablePresentation", "CredentialFulfillment"],
      holder: holder.did,
      verifiableCredential: cwJwt
    },
    presentation_submission: {
      id: uuidv4(),
      definition_id: `KYBPAMLAttestation-${uuidv4()}`,
      descriptor_map: [cwJwt]
        .flat()
        .map(
          (_vc, i) =>
            ({
              format: "jwt_vc",
              id: "kybpaml_input",
              path: `$.verifiableCredential[${i}]`
            } as Record<string, unknown>)
        )
        .concat(
          opts.additionalDescriptorMapFields
            ? opts.additionalDescriptorMapFields
            : []
        )
    }
  }
}

export const verifiablePresentationFactory = async (opts: Opts = {}) => {
  const holder = opts.holder ?? (await signerFactory())
  const subject = opts.subject ? opts.subject : DID_PKH
  const vcJWT = opts.vcJWT
    ? opts.vcJWT
    : await verifiableCredentialFactory({
        subject,
        issuer: opts.vcIssuer
      })

  const payload: JwtPresentationPayload = verifiablePresentationJsonFactory(
    holder,
    vcJWT,
    opts
  )

  return createVerifiablePresentationJwt(payload, holder, {
    challenge: opts.challenge
  })
}

export const decodedVerifiablePresentationFactory = async (opts: Opts = {}) => {
  const encoded = await verifiablePresentationFactory(opts)
  return decodeVerifiablePresentation(encoded, {
    challenge: opts.challenge
  })
}
