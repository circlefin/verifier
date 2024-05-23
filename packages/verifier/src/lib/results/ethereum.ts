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

import { ethers } from "ethers"

import { logger } from "../../logger"
import { VerificationResult } from "../../types/verification-result"
import { buildWallet } from "../ethers"

import { defaultExpiration } from "./defaults"

type Options = {
  subject: string
  chainId: number | null
  name: string | null
  version: string | null
  registryAddress: string | null
  expiration?: Date
  privateKey?: string
  verifier_verification_id: string
  schema: Array<string>
}

type DomainSeparator = {
  name?: string
  version?: string
  verifyingContract?: string
  chainId?: number
}

// Structured Types used for Verification Results
const types = {
  VerificationResult: [
    { name: "schema", type: "string[]" },
    { name: "subject", type: "address" },
    { name: "expiration", type: "uint256" },
    { name: "verifier_verification_id", type: "string" }
  ]
}

/**
 * Generate an Ethereum-based VerificationRecord
 *
 * Uses EIP-712 to generate a VerificationRecord for use on the Ethereum
 * blockchain.
 *
 * See also: https://eips.ethereum.org/EIPS/eip-712
 */
export const ethereum = async ({
  subject,
  chainId,
  registryAddress,
  name,
  version,
  verifier_verification_id,
  schema,
  ...options
}: Options): Promise<{
  verificationResult: VerificationResult
  signature: string
}> => {
  const domain = domainSeparator({ name, version, registryAddress, chainId })
  const expiration = Math.floor(
    (options.expiration ?? defaultExpiration()).getTime() / 1000
  )

  const verificationResult: VerificationResult = {
    schema,
    subject,
    expiration,
    verifier_verification_id
  }

  const wallet = buildWallet(options.privateKey)

  logger.info(`wallet addres: ${wallet.address}`)

  const signature = await wallet._signTypedData(
    domain,
    types,
    verificationResult
  )

  const rcvAddr = ethers.utils.verifyTypedData(
    domain,
    types,
    verificationResult,
    signature
  )
  logger.info(`recovered address: ${rcvAddr}`)

  return {
    verificationResult,
    signature
  }
}

/**
 * Generate an EIP-712 domain separator
 *
 * A domain separator ensures that a given VerificationResult can only be used
 * on the given chain and for the given address. E.g. a verification for the
 * Ropsten network will be rejected if used on mainnet.
 *
 * Definition: https://eips.ethereum.org/EIPS/eip-712#definition-of-domainseparator
 * Rationale: https://eips.ethereum.org/EIPS/eip-712#rationale-for-domainseparator
 *
 * @param verifyingContract registry address
 * @param chainId EIP-155 chain id
 *
 * @returns EIP-712 domain separator
 */
const domainSeparator = ({
  name,
  version,
  registryAddress,
  chainId
}: {
  name: string | null
  version: string | null
  registryAddress: string | null
  chainId: number | null
}): DomainSeparator => {
  const separator: DomainSeparator = {}

  if (name) {
    separator.name = name
  }

  if (version) {
    separator.version = version
  }

  if (registryAddress) {
    separator.verifyingContract = registryAddress
  }

  if (chainId) {
    separator.chainId = chainId
  }

  return separator
}
