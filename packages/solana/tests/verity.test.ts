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

import { expect, jest, test } from "@jest/globals"
import * as anchor from "@project-serum/anchor"
import { Program } from "@project-serum/anchor"
import * as borsh from "@project-serum/borsh"
import { Keypair } from "@solana/web3.js"
import { ethers } from "ethers"
import { keccak_256 } from "js-sha3"
import { ecdsaRecover, ecdsaSign, publicKeyConvert } from "secp256k1"

import { Verity } from "../target/types/verity"

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

type Message = {
  name: string
  version: number
  cluster: string
  subject: anchor.web3.PublicKey
  expiration: anchor.BN
  schema: string
}

const LAYOUT: borsh.Layout<Message> = borsh.struct([
  borsh.str("name"),
  borsh.u8("version"),
  borsh.str("cluster"),
  borsh.publicKey("subject"),
  borsh.i64("expiration"),
  borsh.str("schema")
])

describe("verity", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.Provider.env())

  const program = anchor.workspace.Verity as Program<Verity>

  /**
   * This test is to demonstrate how one can sign the Verification Result and
   * subsequently recover the public key in the javascript runtime.
   */
  it("verifies with javascript runtime", async () => {
    // Setup Verification Result
    const subject = Keypair.fromSecretKey(
      Buffer.from([
        227, 80, 186, 154, 55, 145, 36, 72, 120, 28, 132, 63, 128, 109, 38, 37,
        182, 90, 114, 36, 161, 3, 185, 206, 219, 248, 127, 56, 0, 70, 178, 70,
        208, 60, 226, 246, 39, 234, 14, 186, 106, 58, 173, 49, 250, 196, 52,
        154, 159, 52, 216, 41, 180, 86, 13, 119, 82, 99, 173, 92, 28, 219, 109,
        15
      ])
    )
    const verificationResult = {
      name: "VerificationRegistry",
      version: 1,
      cluster: "localnet",
      subject: subject.publicKey,
      expiration: new anchor.BN(2644257401),
      schema: "centre.io/credentials/kyc"
    }

    // Serialize the verification result using Borsh.
    const message = Buffer.alloc(24 + 1 + 12 + 32 + 8 + 25 + 4)
    LAYOUT.encode(verificationResult, message)

    // Hash the message using keccak 256.
    const messageHash = Buffer.from(keccak_256.update(message).digest())

    // This is the verifier's secret key
    const secretKey = ethers.utils.arrayify(
      new ethers.Wallet(
        "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
      ).privateKey
    )

    // Sign
    const { signature, recid } = ecdsaSign(messageHash, secretKey)

    // Recover
    const recovered = ecdsaRecover(signature, recid, messageHash)

    // Recovery id of this signature is 0
    expect(recid).toBe(0)

    // ecdsaRecover returns a compressed public key. We must convert it to an
    // uncompressed public key in order to convert to an ETH address.
    const publicKey = publicKeyConvert(recovered, false).slice(1)

    const recoveredEthAddress = publicKeyToEthAddress(publicKey)

    // Confirm the verifier's public key
    const wallet = new ethers.Wallet(secretKey)
    expect("0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266").toBe(wallet.address)

    // Confirm the recovered key matches. We use ethers to get the checksum address
    expect(wallet.address).toBe(
      ethers.utils.getAddress(ethers.utils.hexlify(recoveredEthAddress))
    )
  })

  /**
   * This test is to demonstrate how one can sign the Verification Result in
   * the javascript runtime and call the Solana program.
   */
  it("can verify on Solana", async () => {
    // Setup Verification Result
    const subject = Keypair.fromSecretKey(
      Buffer.from([
        227, 80, 186, 154, 55, 145, 36, 72, 120, 28, 132, 63, 128, 109, 38, 37,
        182, 90, 114, 36, 161, 3, 185, 206, 219, 248, 127, 56, 0, 70, 178, 70,
        208, 60, 226, 246, 39, 234, 14, 186, 106, 58, 173, 49, 250, 196, 52,
        154, 159, 52, 216, 41, 180, 86, 13, 119, 82, 99, 173, 92, 28, 219, 109,
        15
      ])
    )
    const verificationResult = {
      name: "VerificationRegistry",
      version: 1,
      cluster: "localnet",
      subject: subject.publicKey,
      expiration: new anchor.BN(2644257401),
      schema: "centre.io/credentials/kyc"
    }

    // Serialize the verification result using Borsh.
    const message = Buffer.alloc(24 + 1 + 12 + 32 + 8 + 25 + 4)
    LAYOUT.encode(verificationResult, message)

    // Hash the message using keccak 256.
    const messageHash = Buffer.from(keccak_256.update(message).digest())

    // This is the verifier's secret key
    const secretKey = ethers.utils.arrayify(
      new ethers.Wallet(
        "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
      ).privateKey
    )

    // Sign
    const { signature, recid } = ecdsaSign(messageHash, secretKey)
    expect(ethers.utils.hexlify(signature)).toBe(
      "0xc68f486da1a249f46534a439e1b382080e17695ebfde09ca3cbf5ec29d915b721e47f247c8df2e076a73f6b99dbe304ff898f9b40aa376a5e423591efdcef77f"
    )
    expect(recid).toBe(0)
    console.log(ethers.utils.hexlify(signature))

    // Send transaction
    await program.rpc.initialize(signature, recid, verificationResult, {
      accounts: {
        subject: subject.publicKey,
        clock: anchor.web3.SYSVAR_CLOCK_PUBKEY
      },
      signers: [subject]
    })
  })
})
