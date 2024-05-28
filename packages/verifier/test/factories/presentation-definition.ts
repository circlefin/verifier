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

import {
  InputDescriptorField,
  PresentationDefinition
} from "../../src/lib/presentation-definition"

type Opts = {
  id?: string
  trustedIssuers?: string
  schema?: string
  additionalFields?: InputDescriptorField[]
}

export const presentationDefinitionFactory = ({
  id,
  trustedIssuers,
  schema,
  additionalFields
}: Opts = {}): PresentationDefinition => {
  const fields: InputDescriptorField[] = [
    {
      path: ["$.issuer.id", "$.issuer", "$.vc.issuer", "$.iss"],
      purpose: "The issuer of the credential must be trusted",
      predicate: "required",
      filter: {
        pattern: trustedIssuers ?? "^did:web:circle.com$",
        type: "string"
      }
    },
    {
      path: [
        `$.credentialSubject.KYBPAMLAttestation.process`,
        `$.vc.credentialSubject.KYBPAMLAttestation.process`,
        `$.KYBPAMLAttestation.process`
      ],
      purpose: `The process used for KYC/AML.`,
      predicate: "required",
      filter: {
        type: "string"
      }
    },
    {
      path: [
        `$.credentialSubject.KYBPAMLAttestation.approvalDate`,
        `$.vc.credentialSubject.KYBPAMLAttestation.approvalDate`,
        `$.KYBPAMLAttestation.approvalDate`
      ],
      purpose: `The date upon which this KYC/AML Attestation was issued.`,
      predicate: "required",
      filter: {
        type: "string",
        pattern:
          "^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}.[0-9]{3}Z$"
      }
    }
  ]

  return {
    id: id ?? uuidv4(),
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
        name: "Proof of KYC",
        purpose: "Please provide a valid credential from a KYC/AML issuer",
        schema: [
          {
            uri:
              schema ??
              "https://verite.id/definitions/processes/kycaml/0.0.1/generic--usa-legal_person",
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
          fields: fields.concat(additionalFields ?? [])
        }
      }
    ]
  }
}
