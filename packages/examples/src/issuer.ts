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

import { importJWK, SignJWT } from "jose"
import {
  decodeVerifiableCredential,
  decodeVerifiablePresentation
} from "verifier"

import issuerDidDocument from "./did-documents/issuer-did.json"
import subjectDidDocument from "./did-documents/subject-did.json"

/**
 * Step 1: Generate a VC for the subject
 */
export const generateVerifiableCredential = async (): Promise<{
  verifiableCredential: string
  decodedVerifiableCredential: Record<string, unknown>
}> => {
  const issuerPrivateKey = await importJWK(
    issuerDidDocument.keys[0].privateKeyJwk,
    "ES256K"
  )

  const verifiableCredentialPayload = {
    "@context": [
      "https://www.w3.org/2018/credentials/v1",
      "https://verite.id/identity"
    ],
    type: ["VerifiableCredential", "KYCAMLAttestation"],
    credentialSubject: {
      id: subjectDidDocument.didDocument.id,
      KYCAMLAttestation: {
        type: "KYCAMLAttestation",
        process: "https://circle.com/schemas/definitions/1.0.0/kycaml/usa",
        approvalDate: new Date()
      }
    },
    issuanceDate: new Date() // now
  }

  /**
   * The following method is from DIF's `did-jwt-vc` library
   * (https://github.com/decentralized-identity/did-jwt-vc). It will validate
   * and sign the VC (creating the `proof` object for the VC), and return the VC
   * in JWT format.
   */
  const signer = new SignJWT(verifiableCredentialPayload)
  const verifiableCredential = await signer
    .setIssuer(issuerDidDocument.didDocument.id)
    .setSubject(subjectDidDocument.didDocument.id)
    .setProtectedHeader({ alg: "ES256K" })
    .setExpirationTime("30d")
    .sign(issuerPrivateKey)

  const decodedVerifiableCredential = await decodeVerifiableCredential(
    verifiableCredential
  )

  return {
    verifiableCredential,
    decodedVerifiableCredential
  }
}

/**
 * Step 2: Wrap the VC in a "Credential Fulfillment" (Verifiable Presentation)
 * so a wallet can properly extract the VC.
 */
export const generateCredentialFulfillment = async (
  verifiableCredential: string
) => {
  const issuerPrivateKey = await importJWK(
    issuerDidDocument.keys[0].privateKeyJwk,
    "ES256K"
  )

  const verifiablePresentationPayload = {
    // nonce: verificationOffer.body.challenge,
    vp: {
      "@context": ["https://www.w3.org/2018/credentials/v1"],
      type: ["VerifiablePresentation", "CredentialFulfillment"],
      holder: issuerDidDocument.didDocument.id,
      verifiableCredential: [verifiableCredential]
    },
    credential_fulfillment: {
      id: "b68fda51-21aa-4cdf-84b7-d452b1c9c3cc", // random UUID
      manifest_id: "KYCAMLAttestation",
      descriptor_map: [
        {
          id: "proofOfIdentifierControlVP",
          format: "jwt_vc",
          path: "$.presentation.credential[0]"
        }
      ]
    }
  }

  const verifiablePresentation = await new SignJWT(
    verifiablePresentationPayload
  )
    .setIssuer(issuerDidDocument.didDocument.id)
    .setSubject(issuerDidDocument.didDocument.id)
    .setProtectedHeader({ alg: "ES256K" })
    .sign(issuerPrivateKey)

  const decodedVerifiablePresentation = await decodeVerifiablePresentation(
    verifiablePresentation
  )

  return {
    verifiablePresentation,
    decodedVerifiablePresentation
  }
}

/**
 * This method simulates an Issuer, and returns a Verifiable Credential, issued
 * by the issuer in `issuer-did.json` for the subject in `subject-did.json`.
 *
 * The method will return both a JWT-encoded Verifiable Credential, and a
 * decoded version of the same Verifiable Credential for easier inspection.
 */
export const performIssuance = async (): Promise<void> => {
  /**
   * Step 1: Generate a VC for the subject
   */
  const { verifiableCredential, decodedVerifiableCredential } =
    await generateVerifiableCredential()
  console.log("\nStep 1: Generate a VC for the subject")
  console.log("JWT format:")
  console.log(verifiableCredential)
  console.log("\n Decoded:")
  console.log(JSON.stringify(decodedVerifiableCredential, null, 4))

  /**
   * Step 2: Wrap the VC in a "Credential Fulfillment" (Verifiable Presentation)
   * so a wallet can properly extract the VC.
   */
  const { verifiablePresentation, decodedVerifiablePresentation } =
    await generateCredentialFulfillment(verifiableCredential)
  console.log(
    "\nStep 2: Wrap the VC in a Verifiable Presentation (Credential Fulfillment)"
  )
  console.log("JWT format:")
  console.log(verifiablePresentation)
  console.log("\n Decoded:")
  console.log(JSON.stringify(decodedVerifiablePresentation, null, 4))

  /**
   * Step 3: The wallet will extract the VC from the Verifiable Presentation,
   */
  const decodedVP = await decodeVerifiablePresentation(verifiablePresentation)
  const decodedVC = decodedVP.verifiableCredential?.[0]
  console.log("\n Decoded Verifiable Credential for the Wallet:")
  console.log(JSON.stringify(decodedVC, null, 4))
}
