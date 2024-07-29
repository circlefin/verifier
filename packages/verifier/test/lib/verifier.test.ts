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

import { createJWS } from "did-jwt"
import {
  transformCredentialInput,
  validateJwtCredentialPayload
} from "did-jwt-vc"
import nock from "nock"

import {
  buildPresentationDefinition,
  PresentationDefinition
} from "../../src/lib/presentation-definition"
import { verify } from "../../src/lib/verifier"
import {
  generateRandomEthAddress,
  getDidPkhFromEthAddress,
  signerFactory,
  SingerAlg
} from "../factories/did"
import { presentationDefinitionFactory } from "../factories/presentation-definition"
import {
  encodedRevocationListCredentialFactory,
  revocationStatusListFactory
} from "../factories/revocationList"
import { verifiableCredentialFactory } from "../factories/verifiable-credential"
import { verifiablePresentationFactory } from "../factories/verifiable-presentation"
import { verificationFactory } from "../factories/verification"

test("verify() accepts a valid Verifiable Presentation and returns a Verification Result", async () => {
  const issuer = await signerFactory()
  const presentationDefinition = presentationDefinitionFactory({
    trustedIssuers: `^${issuer.did}$`
  })
  const { subject, challenge } = await verificationFactory({
    presentationDefinition
  })

  const holder = await signerFactory()
  const verifiablePresentation = await verifiablePresentationFactory({
    holder,
    challenge,
    vcIssuer: issuer
  })

  await expect(
    verify(presentationDefinition, verifiablePresentation, subject, challenge)
  ).resolves.not.toThrow()
})

test("verify() accepts a valid Verifiable Presentation containing multiple Verifiable Credentials", async () => {
  const holder = await signerFactory()
  const issuer = await signerFactory()
  const presentationDefinition = presentationDefinitionFactory({
    trustedIssuers: `^${issuer.did}$`
  })
  const { subject, challenge } = await verificationFactory({
    presentationDefinition
  })
  const vc = await verifiableCredentialFactory({ issuer })

  const verifiablePresentation = await verifiablePresentationFactory({
    holder,
    challenge,
    vcJWT: [vc, vc]
  })

  await expect(
    verify(presentationDefinition, verifiablePresentation, subject, challenge)
  ).resolves.not.toThrow()
})

test("verify() rejects malformed Verifiable Presentations", async () => {
  const { subject, challenge, presentationDefinition } =
    await verificationFactory()
  const verifiablePresentation = await verifiablePresentationFactory({
    challenge
  })

  await expect(
    verify(
      presentationDefinition as PresentationDefinition,
      verifiablePresentation.split(".")[0],
      subject,
      challenge
    )
  ).rejects.toThrow("Input isn't a valid Verifiable Presentation")
})

test("verify() rejects Verifiable Presentations which contains an empty array of Verifiable Credentials", async () => {
  const { subject, challenge, presentationDefinition } =
    await verificationFactory()
  const holder = await signerFactory()
  const verifiablePresentation = await verifiablePresentationFactory({
    holder,
    challenge,
    vcJWT: []
  })

  await expect(
    verify(
      presentationDefinition as PresentationDefinition,
      verifiablePresentation,
      subject,
      challenge
    )
  ).rejects.toThrow("No Verifiable Credential provided")
})

test("verify() rejects Verifiable Presentations with an invalid challenge", async () => {
  const issuer = await signerFactory()
  const presentationDefinition = presentationDefinitionFactory({
    trustedIssuers: `^${issuer.did}$`
  })
  const { subject, challenge } = await verificationFactory({
    presentationDefinition
  })

  const holder = await signerFactory()
  const verifiablePresentation = await verifiablePresentationFactory({
    holder,
    challenge: "some-invalid-challenge",
    vcIssuer: issuer
  })

  await expect(
    verify(presentationDefinition, verifiablePresentation, subject, challenge)
  ).rejects.toThrow("Input isn't a valid Verifiable Presentation")
})

test("verify() rejects credentials with invalid signature", async () => {
  const holder = await signerFactory(SingerAlg.ES256K)
  const issuer = await signerFactory(SingerAlg.ES256K)
  const signer = await signerFactory(SingerAlg.ES256K)
  const presentationDefinition = presentationDefinitionFactory({
    trustedIssuers: `^${issuer.did}$`
  })
  const vcJson = {
    "@context": [
      "https://www.w3.org/2018/credentials/v1",
      "https://verite.id/identity"
    ],
    type: ["VerifiableCredential", "KYBPAMLAttestation"],
    credentialSubject: {
      id: holder.did,
      KYBPAMLAttestation: Object.assign({
        type: "KYBPAMLAttestation",
        process:
          "https://verite.id/definitions/processes/kycaml/0.0.1/generic--usa-legal_person",
        approvalDate: new Date().toJSON()
      })
    },
    credentialStatus: revocationStatusListFactory(),
    expirationDate: new Date(Date.now() + 1000),
    issuanceDate: new Date(),
    issuer: { id: issuer.did }
  }
  const parsedPayload = transformCredentialInput(vcJson)
  // sanity check the transformed payload
  validateJwtCredentialPayload(parsedPayload)

  // sign this VC using a public key other than the issuer
  const vc_jwt = await createJWS(parsedPayload, signer.signer, {
    alg: signer.alg,
    type: "JWT"
  })

  const { challenge } = await verificationFactory({
    presentationDefinition
  })

  const verifiablePresentation = await verifiablePresentationFactory({
    holder,
    challenge,
    vcJWT: [vc_jwt]
  })

  await expect(
    verify(presentationDefinition, verifiablePresentation, challenge)
  ).rejects.toThrow(
    "Input isn't a valid Verifiable Credential. Invalid signature."
  )
})

test("verify() rejects credentials from an untrusted issuer", async () => {
  const issuer = await signerFactory()
  const trustedIssuer = await signerFactory()
  const presentationDefinition = presentationDefinitionFactory({
    trustedIssuers: `^${trustedIssuer.did}$`
  })
  const { subject, challenge } = await verificationFactory({
    presentationDefinition
  })

  const holder = await signerFactory()
  const verifiablePresentation = await verifiablePresentationFactory({
    holder,
    challenge,
    vcIssuer: issuer
  })

  await expect(
    verify(presentationDefinition, verifiablePresentation, subject, challenge)
  ).rejects.toThrow("The issuer of the credential must be trusted")
})

test("verify() rejects expired credentials", async () => {
  const { subject, challenge, presentationDefinition } =
    await verificationFactory()
  const expirationDate = new Date(Date.now() - 1000)
  const vc = await verifiableCredentialFactory({ expirationDate })

  const verifiablePresentation = await verifiablePresentationFactory({
    challenge,
    vcJWT: vc
  })

  await expect(
    verify(
      presentationDefinition as PresentationDefinition,
      verifiablePresentation,
      subject,
      challenge
    )
  ).rejects.toThrow("Credential has expired.")
})

test("verify() rejects revoked credentials", async () => {
  const issuer = await signerFactory()
  const holder = await signerFactory()
  const presentationDefinition = presentationDefinitionFactory({
    trustedIssuers: `^${issuer.did}$`
  })
  const { subject, challenge } = await verificationFactory({
    presentationDefinition
  })

  const credentialStatus = revocationStatusListFactory(42)
  const revocationList = await encodedRevocationListCredentialFactory({
    statusList: [42]
  })
  const vcJWT = await verifiableCredentialFactory({
    credentialStatus,

    issuer
  })

  const verifiablePresentation = await verifiablePresentationFactory({
    holder,
    challenge,
    vcJWT
  })

  nock("https://example.com").get("/revocation-list").reply(200, revocationList)

  await expect(
    verify(presentationDefinition, verifiablePresentation, subject, challenge)
  ).rejects.toThrow("Credential has been revoked.")
})

test("verify() rejects credentials missing approvalDate", async () => {
  const issuer = await signerFactory()
  const holder = await signerFactory()
  const presentationDefinition = presentationDefinitionFactory({
    trustedIssuers: `^${issuer.did}$`
  })
  const { subject, challenge } = await verificationFactory({
    presentationDefinition
  })

  const vcJWT = await verifiableCredentialFactory({
    issuer,
    approvalDate: null
  })

  const verifiablePresentation = await verifiablePresentationFactory({
    holder,
    challenge,
    vcJWT
  })

  await expect(
    verify(presentationDefinition, verifiablePresentation, subject, challenge)
  ).rejects.toThrow(
    "Credential does not adhere to schema: /approvalDate must be string"
  )
})

test("verify() rejects credentials missing the KYC process", async () => {
  const issuer = await signerFactory()
  const holder = await signerFactory()
  const presentationDefinition = presentationDefinitionFactory({
    trustedIssuers: `^${issuer.did}$`
  })
  const { subject, challenge } = await verificationFactory({
    presentationDefinition
  })

  const vcJWT = await verifiableCredentialFactory({
    issuer,
    process: null
  })

  const verifiablePresentation = await verifiablePresentationFactory({
    holder,
    challenge,
    vcJWT
  })

  await expect(
    verify(presentationDefinition, verifiablePresentation, subject, challenge)
  ).rejects.toThrow(
    "Credential does not adhere to schema: /process must be string"
  )
})

test("verify() rejects credentials with an invalid schema", async () => {
  const issuer = await signerFactory()
  const holder = await signerFactory()
  const presentationDefinition = presentationDefinitionFactory({
    trustedIssuers: `^${issuer.did}$`
  })
  const { subject, challenge } = await verificationFactory({
    presentationDefinition
  })

  const vcJWT = await verifiableCredentialFactory({
    issuer,
    approvalDate: "not-an-iso-8601-string" // not a string
  })

  const verifiablePresentation = await verifiablePresentationFactory({
    holder,
    challenge,
    vcJWT
  })

  await expect(
    verify(presentationDefinition, verifiablePresentation, subject, challenge)
  ).rejects.toThrow(
    "Credential did not satisfy required constraint: The date upon which this KYC/AML Attestation was issued."
  )
})

test("verify() rejects when given an invalid schema", async () => {
  const issuer = await signerFactory()
  const presentationDefinition = presentationDefinitionFactory({
    schema: "some-unknown-schema",
    trustedIssuers: `^${issuer.did}$`
  })
  const { subject, challenge } = await verificationFactory({
    presentationDefinition
  })

  const holder = await signerFactory()
  const verifiablePresentation = await verifiablePresentationFactory({
    holder,
    challenge,
    vcIssuer: issuer
  })

  await expect(
    verify(presentationDefinition, verifiablePresentation, subject, challenge)
  ).rejects.toThrow("Unknown schema: some-unknown-schema")
})

test("verify() rejects when given an invalid credential type", async () => {
  const holder = await signerFactory()
  const issuer = await signerFactory()
  const presentationDefinition = presentationDefinitionFactory({
    trustedIssuers: `^${issuer.did}$`
  })
  const { subject, challenge } = await verificationFactory({
    presentationDefinition
  })

  const vcJWT = await verifiableCredentialFactory({
    issuer,
    credentialType: "NotKYBPAML"
  })

  const verifiablePresentation = await verifiablePresentationFactory({
    holder,
    challenge,
    vcJWT
  })

  await expect(
    verify(presentationDefinition, verifiablePresentation, subject, challenge)
  ).rejects.toThrow(
    "Submission claims having descriptorId kybpaml_input but the matching type KYBPAMLAttestation does not exist in the credential"
  )
})

test("verify() rejects when given an invalid credential type attestation", async () => {
  const holder = await signerFactory()
  const issuer = await signerFactory()
  const presentationDefinition = buildPresentationDefinition({
    trustedIssuers: `^${issuer.did}$`
  })
  presentationDefinition.input_descriptors.push()
  const { subject, challenge } = await verificationFactory({
    presentationDefinition
  })

  const vcJWT = await verifiableCredentialFactory({
    issuer,
    additionalCredentialTypes: ["EntityAccInvAttestation"]
  })

  const verifiablePresentation = await verifiablePresentationFactory({
    holder,
    challenge,
    vcJWT,
    additionalDescriptorMapFields: [
      {
        format: "jwt_vc",
        id: "accinv_input",
        path: "$.verifiableCredential[0]"
      }
    ]
  })

  await expect(
    verify(presentationDefinition, verifiablePresentation, subject, challenge)
  ).rejects.toThrow(
    "No attestation of type EntityAccInvAttestation present in credential"
  )
})

test("verify() rejects if a required field is missing", async () => {
  const issuer = await signerFactory()
  const holder = await signerFactory()
  const presentationDefinition = presentationDefinitionFactory({
    trustedIssuers: `^${issuer.did}$`,
    additionalFields: [
      {
        path: ["$.credentialSubject.KYBPAMLAttestation.someRandomField"],
        purpose: "A Random Field",
        predicate: "required",
        filter: {
          type: "string"
        }
      }
    ]
  })
  const { subject, challenge } = await verificationFactory({
    presentationDefinition
  })

  const vcJWT = await verifiableCredentialFactory({
    issuer
  })

  const verifiablePresentation = await verifiablePresentationFactory({
    holder,
    challenge,
    vcJWT
  })

  await expect(
    verify(presentationDefinition, verifiablePresentation, subject, challenge)
  ).rejects.toThrow("Credential is missing required field: A Random Field")
})

test("verify() allows `preferred` constraints to pass even if failing", async () => {
  const issuer = await signerFactory()
  const holder = await signerFactory()
  const presentationDefinition = presentationDefinitionFactory({
    trustedIssuers: `^${issuer.did}$`,
    additionalFields: [
      {
        path: ["$.credentialSubject.KYBPAMLAttestation.someRandomField"],
        purpose: "A Random Field",
        predicate: "preferred",
        filter: {
          type: "string"
        }
      }
    ]
  })
  const { subject, challenge } = await verificationFactory({
    presentationDefinition
  })

  const vcJWT = await verifiableCredentialFactory({
    issuer
  })

  const verifiablePresentation = await verifiablePresentationFactory({
    holder,
    challenge,
    vcJWT
  })

  await expect(
    verify(presentationDefinition, verifiablePresentation, subject, challenge)
  ).resolves.not.toThrow()
})

test("verify() rejects if a submit contains a VC that is owned not by the verification request subject", async () => {
  const issuer = await signerFactory()
  const presentationDefinition = presentationDefinitionFactory({
    trustedIssuers: `^${issuer.did}$`
  })

  const verificationRequestSubject = generateRandomEthAddress()
  const { challenge } = await verificationFactory({
    subject: verificationRequestSubject,
    presentationDefinition
  })

  const holder = await signerFactory()
  const vcSubjectAddress = generateRandomEthAddress()
  const vcSubject = getDidPkhFromEthAddress(vcSubjectAddress)
  const verifiablePresentation = await verifiablePresentationFactory({
    holder,
    challenge,
    vcIssuer: issuer,
    subject: vcSubject
  })

  await expect(
    verify(
      presentationDefinition,
      verifiablePresentation,
      verificationRequestSubject,
      challenge
    )
  ).rejects.toThrow(
    `Credential subject does not match the subject in the verification request. ${vcSubjectAddress} is not equal to ${verificationRequestSubject}`
  )
})
