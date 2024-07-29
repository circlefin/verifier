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
  publicKey,
  i64,
  str,
  struct,
  Layout,
  array
} from "@project-serum/borsh"
import { PublicKey } from "@solana/web3.js"
import BN from "bn.js"
import { ethers } from "ethers"
import { keccak_256 } from "js-sha3"
import { ecdsaRecover, ecdsaSign, publicKeyConvert } from "secp256k1"

import { solana } from "../../../src/lib/results"

/**
 * Construct an Ethereum address from a secp256k1 public key buffer.
 * @param {Buffer} publicKey a 64 byte secp256k1 public key buffer
 * Source: https://github.com/solana-labs/solana/blob/e3b137066d89c303ad75a1073b90b9e2e32fd23d/web3.js/src/secp256k1-program.ts#L76-L95
 */
const publicKeyToEthAddress = (
  publicKey: Buffer | Uint8Array | Array<number>
): Buffer => {
  const ETHEREUM_ADDRESS_BYTES = 20
  return Buffer.from(keccak_256.update(publicKey).digest()).slice(
    -ETHEREUM_ADDRESS_BYTES
  )
}

// Type used to serialize the Verification Result using borsh.
type Message = {
  name: string
  version: string
  cluster: string
  expiration: BN
  schema: string[]
  subject: PublicKey
  verifier_verification_id: string
}

test("solana returns a signature", async () => {
  const subject = "37Jon9vY6V9iXavKqTubjXY1iaUVo6xJJyG95SEHvvAV"
  const expiration = 1641492587
  const privateKey =
    "ac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
  const name = "VerificationRegistry"
  const version = "1.0"
  const verifier_verification_id = "c62af7a4-82d5-42be-bd93-df12955e9a4e"
  const schema = [
    "verite.id/definitions/processes/kycaml/0.0.1/generic--usa-legal_person"
  ]

  const { verificationResult, signature } = await solana({
    subject,
    expiration: new Date(expiration * 1000),
    chainId: 1337,
    name,
    version,
    privateKey,
    verifier_verification_id,
    schema
  })

  expect(verificationResult).toEqual({
    name: "VerificationRegistry",
    version: "1.0",
    cluster: "localnet",
    schema,
    subject,
    expiration,
    verifier_verification_id
  })

  expect(signature).toBe(
    "0x452b14e845ca81e9ead06d53db6376a5afb314f790b0a8aa74cc257c062105e240215c7e40d5d1af1ec12a8ce50f0f582bf79dd907e12d1c2fe6ae66bd6a70581c"
  )
})

test("solana returns a different signature for a different subject", async () => {
  const subject = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"
  const expiration = 1641492587
  const privateKey =
    "ac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
  const name = "VerificationRegistry"
  const version = "1.0"
  const verifier_verification_id = "c62af7a4-82d5-42be-bd93-df12955e9a4e"
  const schema = [
    "verite.id/definitions/processes/kycaml/0.0.1/generic--usa-legal_person"
  ]

  const { verificationResult, signature } = await solana({
    subject,
    expiration: new Date(expiration * 1000),
    chainId: 1337,
    name,
    version,
    privateKey,
    verifier_verification_id,
    schema
  })

  expect(verificationResult).toEqual({
    name: "VerificationRegistry",
    version: "1.0",
    cluster: "localnet",
    schema,
    subject,
    expiration,
    verifier_verification_id
  })

  expect(signature).toBe(
    "0xac1f2e8f612d7b6c78ffa6a7ac50ade4e9c6a07baccf8b1e5de69f16f9fa806d0122e39404a76b933fc86b7375e2523aaba40e5595d562efdebad313f46482141b"
  )
})

test("solana returns a different signature for a different expiration", async () => {
  const subject = "37Jon9vY6V9iXavKqTubjXY1iaUVo6xJJyG95SEHvvAV"
  const expiration = 1752503698
  const privateKey =
    "ac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
  const name = "VerificationRegistry"
  const version = "1.0"
  const verifier_verification_id = "c62af7a4-82d5-42be-bd93-df12955e9a4e"
  const schema = [
    "verite.id/definitions/processes/kycaml/0.0.1/generic--usa-legal_person"
  ]

  const { verificationResult, signature } = await solana({
    subject,
    expiration: new Date(expiration * 1000),
    chainId: 1337,
    name,
    version,
    privateKey,
    verifier_verification_id,
    schema
  })

  expect(verificationResult).toEqual({
    name: "VerificationRegistry",
    version: "1.0",
    cluster: "localnet",
    schema,
    subject,
    expiration,
    verifier_verification_id
  })

  expect(signature).toBe(
    "0x028d7b81fb7c782ba6600cbb5964df02a364a8c81eeb9aa19504f99ea148354b33d1727354b420c7407f4dc5c9311aec0d3459e047b800cf059333e35b178e961c"
  )
})

test("solana returns a different signature for a different private key", async () => {
  const subject = "37Jon9vY6V9iXavKqTubjXY1iaUVo6xJJyG95SEHvvAV"
  const expiration = 1641492587
  const privateKey =
    "59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d"
  const name = "VerificationRegistry"
  const version = "1.0"
  const verifier_verification_id = "c62af7a4-82d5-42be-bd93-df12955e9a4e"
  const schema = [
    "verite.id/definitions/processes/kycaml/0.0.1/generic--usa-legal_person"
  ]

  const { verificationResult, signature } = await solana({
    subject,
    expiration: new Date(expiration * 1000),
    chainId: 1337,
    name,
    version,
    privateKey,
    verifier_verification_id,
    schema
  })

  expect(verificationResult).toEqual({
    name: "VerificationRegistry",
    version: "1.0",
    cluster: "localnet",
    schema,
    subject,
    expiration,
    verifier_verification_id
  })

  expect(signature).toBe(
    "0xd2aa52b3cefeea9179497535aba9ea84f410038c2d2aa488b55cfe3b364192a84c9d5edad0f48a3753e67bbb7f51f708c267584fd486f4950b5150028e8e52bb1b"
  )
})

test("sign and recover with recid of 0", () => {
  // This is the message we will hash
  const message = Buffer.from(keccak_256.update("Hello, world!").digest())

  // We sign with this key
  const privateKey = ethers.utils.arrayify(
    "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
  )

  const { signature, recid } = ecdsaSign(message, privateKey)

  const recovered = ecdsaRecover(signature, recid, message)

  expect(recid).toBe(0)
  // ecdsaRecover returns a compressed public key. We must convert it to an
  // uncompressed public key in order to convert to an ETH address.
  const publicKey = publicKeyConvert(recovered, false).slice(1)

  const recoveredEthAddress = publicKeyToEthAddress(publicKey)

  const wallet = new ethers.Wallet(privateKey)
  expect("0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266").toBe(wallet.address)
  expect(wallet.address.toLowerCase()).toBe(
    ethers.utils.hexlify(recoveredEthAddress)
  )
})

test("sign and recover with recid of 1", () => {
  // This is the message we will hash
  const message = Buffer.from(keccak_256.update("Helo, world!").digest())

  // We sign with this key
  const privateKey = ethers.utils.arrayify(
    "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
  )

  const { signature, recid } = ecdsaSign(message, privateKey)

  const recovered = ecdsaRecover(signature, recid, message)

  expect(recid).toBe(1)
  // ecdsaRecover returns a compressed public key. We must convert it to an
  // uncompressed public key in order to convert to an ETH address.
  const publicKey = publicKeyConvert(recovered, false).slice(1)

  const recoveredEthAddress = publicKeyToEthAddress(publicKey)

  const wallet = new ethers.Wallet(privateKey)

  expect("0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266").toBe(wallet.address)
  expect(wallet.address.toLowerCase()).toBe(
    ethers.utils.hexlify(recoveredEthAddress)
  )
})

test("recover public key using a static message", () => {
  const subject = "37Jon9vY6V9iXavKqTubjXY1iaUVo6xJJyG95SEHvvAV"
  const expiration = 1641492587
  const verifier_verification_id = "c62af7a4-82d5-42be-bd93-df12955e9a4e"
  const schema = [
    "verite.id/definitions/processes/kycaml/0.0.1/generic--usa-legal_person"
  ]

  const data = {
    name: "VerificationRegistry",
    version: "1.0",
    cluster: "localnet",
    schema,
    subject: new PublicKey(subject),
    expiration: new BN(expiration),
    verifier_verification_id
  }
  const message = Buffer.alloc(
    24 +
      7 +
      12 +
      32 +
      8 +
      4 +
      schema.reduce((acc, s) => acc + s.length + 4, 0) +
      verifier_verification_id.length +
      4
  )
  // Create the borsh layout.
  const LAYOUT: Layout<Message> = struct([
    str("name"),
    str("version"),
    str("cluster"),
    publicKey("subject"),
    i64("expiration"),
    array<string>(str(), schema.length, "schema"),
    str("verifier_verification_id")
  ])
  LAYOUT.encode(data, message)

  // Create Signature from the message
  const messageHash = Buffer.from(keccak_256.update(message).digest())

  const privateKey = ethers.utils.arrayify(
    "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
  )

  const { signature, recid } = ecdsaSign(messageHash, privateKey)

  const signer = ecdsaRecover(signature, recid, messageHash)
  const publicKey2 = publicKeyConvert(signer, false).slice(1)
  const recoveredEthAddress = publicKeyToEthAddress(publicKey2)
  const signerHex = ethers.utils.hexlify(recoveredEthAddress)

  expect("0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266".toLowerCase()).toBe(
    signerHex
  )
})

test("recover public key using the solana function and result", async () => {
  // Verifier creates a verification result and signature
  const subject = "37Jon9vY6V9iXavKqTubjXY1iaUVo6xJJyG95SEHvvAV"
  const expiration = 1641492587
  const privateKey =
    "ac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
  const name = "VerificationRegistry"
  const version = "1.0"
  const verifier_verification_id = "c62af7a4-82d5-42be-bd93-df12955e9a4e"
  const schema = [
    "https://verite.id/definitions/processes/kycaml/0.0.1/generic--usa-legal_person",
    "https://raw.githubusercontent.com/centrehq/verite/d1b97b3a475aa00cf894f72213f34b7bcb8b3435/packages/docs/static/definitions/processes/kycaml/0.0.1/generic--usa-entity-accinv-all-checks"
  ]

  const { verificationResult, signature } = await solana({
    subject,
    expiration: new Date(expiration * 1000),
    chainId: 1337,
    name,
    version,
    privateKey,
    verifier_verification_id,
    schema
  })

  // Consumer of the verification result first must rehash it
  const message = Buffer.alloc(
    24 +
      7 +
      12 +
      32 +
      8 +
      schema.reduce((acc, s) => acc + s.length + 4, 0) +
      verifier_verification_id.length +
      4
  )

  // Create the borsh layout.
  const LAYOUT: Layout<Message> = struct([
    str("name"),
    str("version"),
    str("cluster"),
    publicKey("subject"),
    i64("expiration"),
    array<string>(str(), schema.length, "schema"),
    str("verifier_verification_id")
  ])
  LAYOUT.encode(
    {
      name: "VerificationRegistry",
      version: "1.0",
      cluster: "localnet",
      expiration: new BN(verificationResult.expiration),
      schema: verificationResult.schema,
      subject: new PublicKey(verificationResult.subject),
      verifier_verification_id
    },
    message
  )
  const messageHash = Buffer.from(keccak_256.update(message).digest())

  // Then recovers the signer
  const signatureArr = ethers.utils.arrayify(signature)
  const recid = signatureArr.slice(64, 65)[0] - 27
  const signer = ecdsaRecover(signatureArr.slice(0, 64), recid, messageHash)

  // Convert the public key to an eth address
  const publicKey2 = publicKeyConvert(signer, false).slice(1)
  const recoveredEthAddress = publicKeyToEthAddress(publicKey2)
  const signerHex = ethers.utils.hexlify(recoveredEthAddress)

  expect("0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266".toLowerCase()).toBe(
    signerHex
  )
})
