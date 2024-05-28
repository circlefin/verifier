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

import nock from "nock"
import request from "supertest"

import { app } from "../../../src/app"
import {
  ETH_ADDRESS,
  generateRandomEthAddress,
  getDidPkhFromEthAddress,
  signerFactory
} from "../../factories/did"
import { jwtFactory } from "../../factories/jwt"
import { presentationDefinitionFactory } from "../../factories/presentation-definition"
import {
  revocationStatusListFactory,
  encodedRevocationListCredentialFactory
} from "../../factories/revocationList"
import { verifiableCredentialFactory } from "../../factories/verifiable-credential"
import {
  decodedVerifiablePresentationFactory,
  verifiablePresentationFactory
} from "../../factories/verifiable-presentation"
import { verificationFactory } from "../../factories/verification"

test("POST /api/v1/verifications/<id> verifies the submission, persists it to the database and responds successfully for ethereum", async () => {
  const vcIssuer = await signerFactory()
  const presentationDefinition = presentationDefinitionFactory({
    trustedIssuers: `^${vcIssuer.did}$`
  })
  const verification = await verificationFactory({ presentationDefinition })

  const submission = await verifiablePresentationFactory({
    challenge: verification.challenge,
    vcIssuer
  })

  const { statusCode, body } = await request(app)
    .post(`/api/v1/verifications/${verification.id}`)
    .set("Content-Type", "text/plain")
    .send(submission)

  expect(statusCode).toBe(201)
  expect(body).toMatchObject({
    status: "success",
    verificationResult: {
      expiration: expect.any(Number),
      schema: [
        "https://verite.id/definitions/processes/kycaml/0.0.1/generic--usa-legal_person"
      ],
      subject: ETH_ADDRESS
    },
    signature: expect.any(String)
  })
})

test("POST /api/v1/verifications/<id> verifies the submission, persists it to the database and responds successfully for solana", async () => {
  const vcIssuer = await signerFactory()
  const presentationDefinition = presentationDefinitionFactory({
    trustedIssuers: `^${vcIssuer.did}$`
  })
  const ethAddress = generateRandomEthAddress()
  const verification = await verificationFactory({
    network: "ethereum",
    subject: ethAddress,
    presentationDefinition
  })

  const vcSubject = getDidPkhFromEthAddress(ethAddress)
  const submission = await verifiablePresentationFactory({
    challenge: verification.challenge,
    vcIssuer,
    subject: vcSubject
  })

  const { statusCode, body } = await request(app)
    .post(`/api/v1/verifications/${verification.id}`)
    .set("Content-Type", "text/plain")
    .send(submission)

  expect(statusCode).toBe(201)
  expect(body).toMatchObject({
    status: "success",
    verificationResult: {
      expiration: expect.any(Number),
      schema: [
        "https://verite.id/definitions/processes/kycaml/0.0.1/generic--usa-legal_person"
      ],
      subject: ethAddress
    },
    signature: expect.any(String)
  })
})

test("POST /api/v1/verifications/<id> fails if the VC is expired", async () => {
  const verification = await verificationFactory()

  const subject = await signerFactory()
  const vcJWT = await verifiableCredentialFactory({
    subject: subject.did,
    expirationDate: new Date(Date.now() - 1000)
  })

  const submission = await verifiablePresentationFactory({
    holder: subject,
    vcJWT,
    challenge: verification.challenge
  })

  const { statusCode, body } = await request(app)
    .post(`/api/v1/verifications/${verification.id}`)
    .set("Content-Type", "text/plain")
    .send(submission)

  expect(statusCode).toBe(400)
  expect(body).toEqual({
    status: 400,
    errors: [{ message: "Credential has expired." }]
  })
})

test("POST /api/v1/verifications/<id> fails if the VC is revoked", async () => {
  const verification = await verificationFactory()

  const credentialStatus = revocationStatusListFactory(42)
  const vcJWT = await verifiableCredentialFactory({
    credentialStatus
  })
  const revocationList = await encodedRevocationListCredentialFactory({
    statusList: [42]
  })

  nock("https://example.com").get("/revocation-list").reply(200, revocationList)

  const submission = await verifiablePresentationFactory({
    vcJWT,
    challenge: verification.challenge
  })

  const { statusCode, body } = await request(app)
    .post(`/api/v1/verifications/${verification.id}`)
    .set("Content-Type", "text/plain")
    .send(submission)

  expect(statusCode).toBe(400)
  expect(body).toEqual({
    status: 400,
    errors: [
      {
        message: "Credential has been revoked."
      }
    ]
  })
})

test("POST /api/v1/verifications/<id> fails if the wrong content-type is provided", async () => {
  const submission = await jwtFactory()
  const verification = await verificationFactory()

  const { statusCode, body } = await request(app)
    .post(`/api/v1/verifications/${verification.id}`)
    .set("Content-Type", "application/json")
    .send(submission)

  expect(statusCode).toBe(400)
  expect(body).toEqual({
    status: 400,
    errors: [{ message: "Unexpected token e in JSON at position 0" }]
  })
})

test("POST /api/v1/verifications/<id> fails if the verification cannot be found", async () => {
  const { statusCode } = await request(app).post("/verifications/foo")

  expect(statusCode).toBe(404)
})

test("POST /api/v1/verifications/<id> fails if the verification has already had a submission", async () => {
  /**
   * Mock an existing Verification in the database
   */
  const vcIssuer = await signerFactory()
  const presentationDefinition = presentationDefinitionFactory({
    trustedIssuers: `^${vcIssuer.did}$`
  })
  const credentialSubmission = await decodedVerifiablePresentationFactory()
  const verification = await verificationFactory({
    credentialSubmission,
    presentationDefinition
  })

  /**
   * Build a new, valid verification submission for the same endpoint
   */
  const submission = await verifiablePresentationFactory({
    challenge: verification.challenge,
    vcIssuer
  })

  const { statusCode, body } = await request(app)
    .post(`/api/v1/verifications/${verification.id}`)
    .set("Content-Type", "text/plain")
    .send(submission)

  expect(statusCode).toBe(400)
  expect(body).toEqual({
    status: 400,
    errors: [{ message: "Verification already complete" }]
  })
})

test("POST /api/v1/verifications/<id> fails if there is no body", async () => {
  const verification = await verificationFactory()

  const { statusCode } = await request(app).post(
    `/api/v1/verifications/${verification.id}`
  )

  expect(statusCode).toBe(400)
})

test("POST /api/v1/verifications/<id> fails if the body is not a valid JWT", async () => {
  const verification = await verificationFactory()

  const { statusCode } = await request(app).post(
    `/api/v1/verifications/${verification.id}`
  )

  expect(statusCode).toBe(400)
})

test("POST /api/v1/verifications/<id> fails if verification subject does not match the VC subject", async () => {
  const verificationSubject = generateRandomEthAddress()
  const verification = await verificationFactory({
    subject: verificationSubject
  })

  const vcSubjectAddress = generateRandomEthAddress()
  const vcSubject = getDidPkhFromEthAddress(vcSubjectAddress)
  const vcJWT = await verifiableCredentialFactory({
    subject: vcSubject
  })

  const submission = await verifiablePresentationFactory({
    vcJWT,
    challenge: verification.challenge
  })

  const { statusCode, body } = await request(app)
    .post(`/api/v1/verifications/${verification.id}`)
    .set("Content-Type", "text/plain")
    .send(submission)

  expect(statusCode).toBe(400)
  expect(body).toEqual({
    status: 400,
    errors: [
      {
        message: `Credential subject does not match the subject in the verification request. ${vcSubjectAddress} is not equal to ${verificationSubject}`
      }
    ]
  })
})
