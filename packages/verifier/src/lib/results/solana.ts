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
import { ecdsaSign } from "secp256k1"

import type { VerificationResult } from "../../types/verification-result"
import { buildWallet } from "../ethers"
import { convertChainIdToCluster } from "../solana"

import { defaultExpiration } from "./defaults"

type Options = {
  subject: string
  chainId: number | null
  name: string | null
  version: string | null
  expiration?: Date
  privateKey?: string
  verifier_verification_id: string
  schema: Array<string>
}

type Message = {
  name: string | null
  version: string | null
  cluster: string | null
  expiration: BN
  schema: Array<string>
  subject: PublicKey
  verifier_verification_id: string
}

/**
 * Generate a Solana-based VerificationRecord
 */
export const solana = async ({
  subject,
  chainId,
  name,
  version,
  verifier_verification_id,
  schema,
  ...options
}: Options): Promise<{
  verificationResult: VerificationResult
  signature: string
}> => {
  const expiration = Math.floor(
    (options.expiration ?? defaultExpiration()).getTime() / 1000
  )

  const cluster = convertChainIdToCluster(chainId) || null

  const verificationResult: VerificationResult = {
    schema,
    subject,
    expiration,
    verifier_verification_id
  }

  /**
   * Use the buildWallet function to get the same fallback mechanism in case
   * a verifier is not defined.
   */
  const wallet = buildWallet(options.privateKey)

  /**
   * Allocate buffer for the message and borsh encode the data. The
   * verification result consists of a public key (32 bytes), a signed 64 bit
   * number (8 bytes), and the schema (4 bytes + length), and UUID string.
   */
  let bufferLength =
    schema.reduce((acc, s) => acc + s.length + 4, 0) +
    32 +
    8 +
    verifier_verification_id.length +
    4

  /**
   * Include optional domain discriminators, order matters here for borsh
   * serialization. If all values given, should be in order of name, version,
   * cluster, subject, expiration, and schema.
   */
  const layouts = [
    publicKey("subject"),
    i64("expiration"),
    array<string>(str(), schema.length, "schema"),
    str("verifier_verification_id")
  ]

  if (cluster) {
    verificationResult.cluster = cluster
    bufferLength += cluster.length + 4
    layouts.unshift(str("cluster"))
  }

  if (version) {
    verificationResult.version = version
    bufferLength += version.length + 4
    layouts.unshift(str("version"))
  }

  if (name) {
    verificationResult.name = name
    bufferLength += name.length + 4
    layouts.unshift(str("name"))
  }

  const message = Buffer.alloc(bufferLength)

  const data = {
    name,
    version,
    cluster,
    schema,
    subject: new PublicKey(subject),
    expiration: new BN(expiration),
    verifier_verification_id
  }

  // BufferLayout has no types and causes a lot of typing issues here.
  // It can safely be disabled

  // eslint-disable-next-line @typescript-eslint/no-unsafe-call
  const LAYOUT: Layout<Message> = struct(layouts) as Layout<Message>

  LAYOUT.encode(data, message)

  // Create Signature from the message
  const messageHash = Buffer.from(keccak_256.update(message).digest())
  const { signature, recid: recoveryId } = ecdsaSign(
    messageHash,
    ethers.utils.arrayify(wallet.privateKey)
  )

  // ECDSA signatures have an extra byte appended to identify the recovery id
  // https://bitcoin.stackexchange.com/a/38909
  const r = new Uint8Array(65)
  r.set(signature, 0)
  r[64] = 27 + recoveryId
  const signatureHex = ethers.utils.hexlify(r)

  return Promise.resolve({
    verificationResult,
    signature: signatureHex
  })
}
