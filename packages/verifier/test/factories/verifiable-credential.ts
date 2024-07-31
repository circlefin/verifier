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

import { createVerifiableCredentialJwt, Issuer } from "did-jwt-vc"

import { decodeVerifiableCredential } from "../../src/lib/coder"
import { StatusList2021Entry } from "../../src/types/credentials"

import { DID_PKH, signerFactory } from "./did"

type Opts = {
  /**
   * The subject's DID for the Verifiable Credential. This is who the issuer
   * issues the credential to.
   */
  subject?: string
  /**
   * The issuer for the Verifiable Credential.
   */
  issuer?: Issuer
  /**
   * The credential's expiration date, if any
   */
  expirationDate?: Date
  /**
   * The credential status, used for revocation
   */
  credentialStatus?: StatusList2021Entry
  /**
   * The date KYC was performed and approved by the issuer
   */
  approvalDate?: string | null
  /**
   * The definition for the KYC process
   */
  process?: string | null
  /**
   * An optional Credential type
   */
  credentialType?: string
  /**
   * An optional Credential type
   */
  additionalCredentialTypes?: [string]
  /**
   * Additional fields for the Attestation
   */
  additionalAttestationFields?: Record<string, unknown>
}

export const verifiableCredentialFactory = async (opts: Opts = {}) => {
  const subject = opts.subject ? opts.subject : DID_PKH
  const issuer = opts.issuer ? opts.issuer : await signerFactory()
  const approvalDate =
    opts.approvalDate === undefined ? new Date().toJSON() : opts.approvalDate
  const process =
    opts.process === undefined
      ? "https://verite.id/definitions/processes/kycaml/0.0.1/generic--usa-legal_person"
      : opts.process

  return createVerifiableCredentialJwt(
    {
      "@context": [
        "https://www.w3.org/2018/credentials/v1",
        "https://verite.id/identity"
      ],
      type: [
        "VerifiableCredential",
        opts.credentialType ?? "KYBPAMLAttestation"
      ].concat(
        opts.additionalCredentialTypes ? opts.additionalCredentialTypes : []
      ),
      credentialSubject: {
        id: subject,
        KYBPAMLAttestation: Object.assign(
          {
            type: "KYBPAMLAttestation",
            process: process,
            approvalDate: approvalDate
          },
          opts.additionalAttestationFields
        )
      },
      credentialStatus: opts.credentialStatus,
      expirationDate: opts.expirationDate,
      issuanceDate: new Date(),
      issuer: { id: issuer.did }
    },
    issuer
  )
}

export const decodedVerifiableCredentialFactory = async (opts: Opts = {}) => {
  const encoded = await verifiableCredentialFactory(opts)
  return decodeVerifiableCredential(encoded)
}
