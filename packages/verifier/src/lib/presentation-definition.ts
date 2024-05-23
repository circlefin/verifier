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

import { v4 as uuidv4 } from "uuid"

export type InputDescriptorField = {
  path: string[]
  id?: string
  purpose?: string
  filter?: InputDescriptorConstraintFilter
  predicate?: "required" | "preferred"
}

/**
 * This defines the type for an Input Descriptor, which defines the information
 * a Verifier requires of the Holder.  All input descriptors must be satisfied
 * by the Holder in order to pass verification.
 *
 * See more: https://identity.foundation/presentation-exchange/#input-descriptor
 */
export type InputDescriptor = {
  id: string
  schema: {
    uri: string
    required?: boolean
  }[]
  group?: string
  name?: string
  purpose?: string
  constraints?: {
    statuses?: {
      active?: {
        directive: "required" | "allowed" | "disallowed"
      }
      suspended?: {
        directive: "required" | "allowed" | "disallowed"
      }
      revoked?: {
        directive: "required" | "allowed" | "disallowed"
      }
    }
    is_holder?: {
      field_id: string[]
      directive: "required" | "preferred"
    }[]
    fields?: InputDescriptorField[]
  }
}

type InputDescriptorConstraintFilter = {
  type: string
  format?: string
  pattern?: string
  minimum?: string | number
  minLength?: number
  maxLength?: number
  exclusiveMinimum?: string | number
  exclusiveMaximum?: string | number
  maximum?: string | number
  const?: string | number
  enum?: string[] | number[]
  not?: InputDescriptorConstraintFilter
}

/**
 * This defines the type for a Presentation Definition, which articulates which
 * proofs are required for the Verifier.
 *
 * See more: https://identity.foundation/presentation-exchange/#presentation-definition
 */
export type PresentationDefinition = {
  id: string
  input_descriptors: InputDescriptor[]
  format: {
    jwt?: {
      alg: string[]
    }
    jwt_vc?: {
      alg: string[]
    }
    jwt_vp?: {
      alg: string[]
    }
  }
  name?: string
  purpose?: string
}

type PresentationDefinitionOptions = {
  trustedIssuers?: string
}

/**
 * Descriptor ID -> credential type
 */
export const DES_ID_TO_CRED_TYPE: { [x: string]: string } = {
  kybpaml_input: "KYBPAMLAttestation",
  accinv_input: "EntityAccInvAttestation"
}

/**
 * Generate a Presentation Definition which defines the required proofs for the
 * Holder of the Attestation to pass verification.
 *
 * See more: https://identity.foundation/presentation-exchange/#presentation-definition
 *
 * Note that, our input_descriptors works slightly different to the above DIF document:
 * For our verifier, it always only verifies whatever the Dapp submitted.
 * In DIF, verifier is supposed to tell the Dapp what to upload for this verification, and only expect those data in the submission.
 */
export const buildPresentationDefinition = ({
  trustedIssuers
}: PresentationDefinitionOptions = {}): PresentationDefinition => {
  return {
    id: uuidv4(),
    format: {
      jwt: {
        alg: ["EdDSA", "ES256K"]
      },
      jwt_vc: {
        alg: ["EdDSA", "ES256K"]
      },
      jwt_vp: {
        alg: ["EdDSA", "ES256K"]
      }
    },
    input_descriptors: [
      {
        id: "kybpaml_input",
        name: "Proof of KYBP",
        purpose: "Please provide a valid credential from a KYBP/AML issuer",
        schema: [
          {
            uri: "https://verite.id/definitions/processes/kycaml/0.0.1/generic--usa-legal_person",
            required: true
          }
        ],
        constraints: {
          statuses: {
            active: {
              directive: "required"
            },
            revoked: {
              directive: "disallowed"
            }
          },
          is_holder: [
            {
              field_id: ["subjectId"],
              directive: "required"
            }
          ],
          fields: [
            {
              path: ["$.issuer.id", "$.issuer", "$.vc.issuer", "$.iss"],
              purpose: "The issuer of the credential must be trusted",
              predicate: "required",
              filter: trustedIssuers
                ? {
                    pattern: trustedIssuers,
                    type: "string"
                  }
                : undefined
            },
            {
              path: [
                `$.credentialSubject.${DES_ID_TO_CRED_TYPE["kybpaml_input"]}.process`,
                `$.vc.credentialSubject.${DES_ID_TO_CRED_TYPE["kybpaml_input"]}.process`,
                `$.${DES_ID_TO_CRED_TYPE["kybpaml_input"]}.process`
              ],
              purpose: `The process used for KYBP/AML.`,
              predicate: "required",
              filter: {
                type: "string"
              }
            },
            {
              path: [
                `$.credentialSubject.${DES_ID_TO_CRED_TYPE["kybpaml_input"]}.approvalDate`,
                `$.vc.credentialSubject.${DES_ID_TO_CRED_TYPE["kybpaml_input"]}.approvalDate`,
                `$.${DES_ID_TO_CRED_TYPE["kybpaml_input"]}.approvalDate`
              ],
              purpose: `The date upon which this KYBP/AML Attestation was issued.`,
              predicate: "required",
              filter: {
                type: "string",
                pattern:
                  "^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}.[0-9]{3}Z$"
              }
            }
          ]
        }
      },
      {
        id: "accinv_input",
        name: "Proof of Accredited Investor from Circle",
        purpose: "Please provide a valid credential from a Accredited Investor",
        schema: [
          {
            uri: "https://raw.githubusercontent.com/centrehq/verite/d1b97b3a475aa00cf894f72213f34b7bcb8b3435/packages/docs/static/definitions/processes/kycaml/0.0.1/generic--usa-entity-accinv-all-checks",
            required: true
          }
        ],
        constraints: {
          statuses: {
            active: {
              directive: "required"
            },
            revoked: {
              directive: "disallowed"
            }
          },
          is_holder: [
            {
              field_id: ["subjectId"],
              directive: "required"
            }
          ],
          fields: [
            {
              path: ["$.issuer.id", "$.issuer", "$.vc.issuer", "$.iss"],
              purpose: "The issuer of the credential must be trusted",
              predicate: "required",
              filter: trustedIssuers
                ? {
                    pattern: trustedIssuers,
                    type: "string"
                  }
                : undefined
            },
            {
              path: [
                `$.credentialSubject.${DES_ID_TO_CRED_TYPE["accinv_input"]}.process`,
                `$.vc.credentialSubject.${DES_ID_TO_CRED_TYPE["accinv_input"]}.process`,
                `$.${DES_ID_TO_CRED_TYPE["accinv_input"]}.process`
              ],
              purpose: `The process used for analysing Accredited Investor.`,
              predicate: "required",
              filter: {
                type: "string"
              }
            },
            {
              path: [
                `$.credentialSubject.${DES_ID_TO_CRED_TYPE["accinv_input"]}.approvalDate`,
                `$.vc.credentialSubject.${DES_ID_TO_CRED_TYPE["accinv_input"]}.approvalDate`,
                `$.${DES_ID_TO_CRED_TYPE["accinv_input"]}.approvalDate`
              ],
              purpose: `The date upon which this Accredited Investor Attestation was issued.`,
              predicate: "required",
              filter: {
                type: "string",
                pattern:
                  "^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}.[0-9]{3}Z$"
              }
            }
          ]
        }
      }
    ]
  }
}
