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

import { randomBytes } from "crypto"

import { generate } from "@transmute/did-key.js"
import bs58 from "bs58"
import { EdDSASigner, ES256KSigner } from "did-jwt"
import { Issuer } from "did-jwt-vc"
import { Wallet } from "ethers"

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
  ld = true
): Promise<DidGeneration> => {
  const didKey = await generate(
    type,
    { secureRandom: () => randomBytes(32) },
    { accept: ld ? "application/did+ld+json" : "application/did+json" }
  )

  return didKey as DidGeneration
}

export const generateRandomEthAddress = (): string => {
  const privateKey = `0x${randomBytes(32).toString("hex")}`
  const wallet = new Wallet(privateKey)
  return wallet.address
}

export const generateRandomDidPkh = (): string => {
  return `did:pkh:eip155:1:${generateRandomEthAddress()}`
}

export const getDidPkhFromEthAddress = (ethAddress: string): string => {
  return `did:pkh:eip155:1:${ethAddress}`
}

export const ETH_ADDRESS = generateRandomEthAddress()
export const DID_PKH = getDidPkhFromEthAddress(ETH_ADDRESS)

export enum SingerAlg {
  EdDSA = "EdDSA",
  ES256K = "ES256K"
}

/**
 * Generate an "Issuer" type (a signer for the JWT) with a randomly selected
 * algorithm, either EdDSA or ES256K.
 */
export const signerFactory = async (algorithm?: SingerAlg): Promise<Issuer> => {
  let alg: SingerAlg
  if (algorithm) {
    alg = algorithm
  } else {
    alg = Math.round(Math.random()) ? SingerAlg.EdDSA : SingerAlg.ES256K
  }
  const did = await didFactory(
    alg === SingerAlg.EdDSA ? "ed25519" : "secp256k1"
  )
  const privateKey = bs58.decode(did.keys[0].privateKeyBase58)
  const signer =
    alg === SingerAlg.EdDSA ? EdDSASigner(privateKey) : ES256KSigner(privateKey)

  return {
    did: did.didDocument.id,
    signer,
    alg
  }
}
