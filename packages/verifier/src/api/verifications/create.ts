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

import assert from "assert"

import { PublicKey } from "@solana/web3.js"
import { isAddress } from "ethers/lib/utils"
import asyncHandler from "express-async-handler"

import { createVerification } from "../../lib/database/verifications"
import { BadRequestError } from "../../lib/errors"
import { buildPresentationDefinition } from "../../lib/presentation-definition"
import { convertClusterToChainId, SOLANA_CHAINS } from "../../lib/solana"
import { url } from "../../lib/url-fns"
import { logger } from "../../logger"

const SUPPORTED_NETWORKS = ["ethereum"]

type Body = {
  network: string
  subject: string
  name?: string
  version?: string
  chainId?: number | string
  registryAddress?: string
}

/**
 * Validate the network parameter
 */
const validateNetwork = (network?: string) => {
  if (!network) {
    throw new BadRequestError("network is required")
  }

  if (!SUPPORTED_NETWORKS.includes(network)) {
    throw new BadRequestError(`Unsupported network: ${network}`)
  }
}

/**
 * Validate the subject address for the given network
 */
const validateSubjectAddress = (network: string, subject?: string) => {
  if (!subject) {
    throw new BadRequestError("subject is required")
  }

  try {
    if (network === "ethereum") {
      assert(isAddress(subject))
    }

    if (network === "solana") {
      const publicKey = new PublicKey(subject)
      assert(PublicKey.isOnCurve(publicKey.toBuffer()))
    }
  } catch (e) {
    throw new BadRequestError(`Invalid subject address for ${network}`)
  }
}

/**
 * Validate the chainId parameter for the given network
 */
const validateChainId = (
  network: string,
  chainId?: string | number
): number | undefined => {
  if (!chainId) {
    return
  }

  if (network === "ethereum") {
    if (typeof chainId !== "number") {
      throw new BadRequestError("chainId must be a number")
    }

    if (chainId < 1) {
      throw new BadRequestError("chainId must be greater than 0")
    }

    return chainId
  }

  if (network === "solana") {
    if (typeof chainId !== "string") {
      throw new BadRequestError("chainId must be a string")
    }

    if (!SOLANA_CHAINS.includes(chainId)) {
      throw new BadRequestError("Invalid chainId")
    }

    return convertClusterToChainId(chainId)
  }
}

/**
 * Validate the name parameter
 */
const validateName = (name?: string) => {
  if (!name) {
    return
  }

  if (typeof name !== "string") {
    throw new BadRequestError("name must be a string")
  }
}

/**
 * Validate the version parameter
 */
const validateVersion = (version?: string) => {
  if (!version) {
    return
  }

  if (typeof version !== "string") {
    throw new BadRequestError("version must be a string")
  }
}

export const _exportedForUnitTests = {
  validateSubjectAddress,
  validateChainId,
  validateName,
  validateVersion
}

/**
 * POST /verifications
 *
 * Create a new verification offer. This is the first step in the Presentation
 * Exchange. This endpoint is called by a 3rd party service and will return a
 * "challengeTokenUrl" for their end-user to fetch.  The challengeTokenUrl will
 * contain the verification offer for the end-user to access.
 *
 * Params:
 * - `subject`: the subject address. Required.
 * - `network`: the network to use for verification ('solana' or 'ethereum') Required.
 * - `chainId`: the chainId for ethereum. if not set, it defaults to 1.
 * - `registryAddress`: the registry address for ethereum. Usually this will be the address of the smart contract, which inherits VerificationRegistry.
 */
export default asyncHandler(async (req, res) => {
  const {
    network,
    subject,
    name,
    version,
    chainId: rawChainId,
    registryAddress
  } = req.body as Body
  logger.info("Create: start to create new verification")

  let chainId
  try {
    validateNetwork(network)
    logger.debug("Create: validated network")

    validateSubjectAddress(network, subject)
    logger.debug("Create: validated network address")

    chainId = validateChainId(network, rawChainId)
    logger.debug("Create: validated chain ID")

    validateName(name)
    logger.debug("Create: validated name")

    validateVersion(version)
    logger.debug("Create: validated version")
  } catch (err) {
    if (err instanceof BadRequestError) {
      err.additionalLoggingDetails = JSON.stringify(req.body as Body)
    }
    throw err
  }

  const presentationDefinition = buildPresentationDefinition({
    trustedIssuers: process.env.TRUSTED_ISSUERS
  })

  logger.info("Create: built presentation")

  const verification = await createVerification({
    network,
    subject,
    chainId,
    registryAddress,
    name,
    version,
    presentationDefinition
  })

  logger.info("Create: created verification", {
    subject,
    verifId: verification.id
  })

  const challengeTokenUrl = url(`/api/v1/verifications/${verification.id}`)
  const statusUrl = url(`/api/v1/verifications/${verification.id}/status`)

  res.status(201).json({ challengeTokenUrl, statusUrl })
})
