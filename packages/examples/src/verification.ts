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

/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import fetch from "cross-fetch"
import { SignJWT, importJWK } from "jose"

import subjectDidDocument from "./did-documents/subject-did.json"
import { generateVerifiableCredential } from "./issuer"

/**
 * Step 1: Initialize a new Verification request
 *
 * A Dapp would call this endpoint and present the response to an end-user
 */
export const initializeVerificationRequest = async () => {
  const response1 = await fetch("http://localhost:3000/verifications", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      network: "ethereum",
      subject: "0xB5de987Ccce0BD596c22939B6f1e2a124e62B232"
    })
  })
  return await response1.json()
}

/**
 * Step 2: Fetch the challengeTokenUrl
 *
 * A client wallet would fetch this endpoint to determine how to submit a
 * credential for verification.
 */
export const fetchVerificationOffer = async (challengeTokenUrl: string) => {
  const response2 = await fetch(challengeTokenUrl, {
    method: "GET",
    headers: {
      "Content-Type": "application/json"
    }
  })
  return response2.json()
}

/**
 * Step 3: Submit a Verifiable Presentation containing the Verifiable Credential
 *
 * A client wallet would call this endpoint to verify their credential.
 *
 * NOTE: This endpoint accepts Content type `text/plain`, not json, as it expects
 * a JWT-encoded Verifiable Presentation.
 */
export const submitCredential = async (
  verificationOffer: any,
  verifiableCredential: string
) => {
  const subjectPrivateKey = await importJWK(
    subjectDidDocument.keys[0].privateKeyJwk,
    "EdDSA"
  )

  const verifiablePresentationPayload = {
    nonce: verificationOffer.body.challenge,
    vp: {
      "@context": ["https://www.w3.org/2018/credentials/v1"],
      type: ["VerifiablePresentation", "PresentationSubmission"],
      holder: subjectDidDocument.didDocument.id,
      verifiableCredential: [verifiableCredential]
    },
    presentation_submission: {
      id: "b68fda51-21aa-4cdf-84b7-d452b1c9c3cc", // random UUID
      definition_id: verificationOffer.body.presentation_definition.id,
      descriptor_map: [verifiableCredential].flat().map((_vc, i) => ({
        format: "jwt_vc",
        id: "kycaml_input",
        path: `$.verifiableCredential[${i}]`
      }))
    }
  }

  const verifiablePresentation = await new SignJWT(
    verifiablePresentationPayload
  )
    .setIssuer(subjectDidDocument.didDocument.id)
    .setSubject(subjectDidDocument.didDocument.id)
    .setProtectedHeader({ alg: "EdDSA" })
    .sign(subjectPrivateKey)

  const response3 = await fetch(verificationOffer.reply_url, {
    method: "POST",
    headers: {
      "Content-Type": "text/plain"
    },
    body: verifiablePresentation
  })

  return response3.json()
}

/**
 * This method simulates a Client Wallet attempting to perform Verification
 * using the Verification Service. The client wallet controls the DID located at
 * `subject-did.json`.
 *
 * This method will perform end-to-end verification of a Verifiable Credential,
 * starting by simulating the Issuer to receive a VC, and then submitting that
 * credential to the Verification Service.
 */
export const performVerification = async () => {
  /**
   * Step 0: Fetch a Verifiable Credential from an issuer. In this example, we
   * will generate a VC using our example issuer.
   */
  const { verifiableCredential, decodedVerifiableCredential } =
    await generateVerifiableCredential()
  console.log("\nStep 0: Using Verifiable Credential:")
  console.log(verifiableCredential)
  console.log("\n\n Decoded Verifiable Credential:")
  console.log(JSON.stringify(decodedVerifiableCredential, null, 4))

  /**
   * Step 1: Initialize a new Verification request
   *
   * A Dapp would call this endpoint and present the response to an end-user
   */
  const json1 = await initializeVerificationRequest()
  console.log("\nStep 1: Create a verification offer")
  console.log(JSON.stringify(json1, null, 4))

  /**
   * Step 2: Fetch the challengeTokenUrl
   *
   * A client wallet would fetch this endpoint to determine how to submit a
   * credential for verification.
   */
  const json2 = await fetchVerificationOffer(json1.challengeTokenUrl)
  console.log("\nStep 2: Client Wallet fetches the challengeTokenUrl")
  console.log(JSON.stringify(json2, null, 4))

  /**
   * Step 3: Submit a Verifiable Presentation containing the Verifiable Credential
   *
   * A client wallet would call this endpoint to verify their credential.
   *
   * NOTE: This endpoint accepts Content type `text/plain`, not json, as it expects
   * a JWT-encoded Verifiable Presentation.
   */
  const json3 = await submitCredential(json2, verifiableCredential)
  console.log("\nStep 3: Submitting a credential")
  console.log(JSON.stringify(json3, null, 4))
}
