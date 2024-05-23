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

// @ts-ignore
import { randomBytes } from "crypto-browserify"

import { generate } from "@transmute/did-key.js"
import bs58 from "bs58"
import { EdDSASigner, ES256KSigner } from "did-jwt"
import { Issuer } from "did-jwt-vc"

type DidKey = {
  id: string
  type: string
  controller: string
  publicKeyBase58: string
  privateKeyBase58: string
}

type DidDocument = {
  id: string
  verificationMethod: Omit<DidKey, "privateKeyBase58">[]
}

type DidGeneration = { didDocument: DidDocument; keys: DidKey[] }

export const didFactory = async (
  type: "ed25519" | "secp256k1" = "ed25519",
  ld = true,
  privateKey?: Uint8Array
): Promise<DidGeneration> => {
  const didKey = await generate(
    type,
    { secureRandom: () => privateKey ?? randomBytes(32) },
    { accept: ld ? "application/did+ld+json" : "application/did+json" }
  )

  return didKey as DidGeneration
}

/**
 * Generate an "Issuer" type (a signer for the JWT) with a randomly selected
 * algorithm, either EdDSA or ES256K.
 */
export const signerFactory = async (
  privateKey?: Uint8Array,
  alg2?: string
): Promise<Issuer> => {
  const alg = alg2 ?? Math.round(Math.random()) ? "EdDSA" : "ES256K"
  const did = await didFactory(
    alg === "EdDSA" ? "ed25519" : "secp256k1",
    true,
    privateKey
  )
  const privateKey2 = bs58.decode(did.keys[0].privateKeyBase58)
  const signer =
    alg === "EdDSA" ? EdDSASigner(privateKey2) : ES256KSigner(privateKey2)

  return {
    did: did.didDocument.id,
    signer,
    alg
  }
}

/**
 * Generate an "Issuer" type for a predefined private key
 */
export const didIssuer = async (): Promise<Issuer> => {
  return signerFactory(
    Buffer.from([
      19, 223, 117, 141, 193, 142, 129, 52, 105, 119, 211, 135, 30, 130, 11, 83,
      16, 183, 86, 198, 138, 26, 117, 175, 170, 39, 1, 247, 38, 102, 205, 115
    ]),
    "ES256K"
  )
}
