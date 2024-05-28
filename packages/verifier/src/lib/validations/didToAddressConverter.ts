/*
 * Copyright (c) 2022, Circle Internet Financial Trading Company Limited.
 * All rights reserved.
 *
 * Circle Internet Financial Trading Company Limited CONFIDENTIAL
 * This file includes unpublished proprietary source code of Circle Internet
 * Financial Trading Company Limited, Inc. The copyright notice above does not
 * evidence any actual or intended publication of such source code. Disclosure
 * of this source code or any related proprietary information is strictly
 * prohibited without the express written permission of Circle Internet Financial
 * Trading Company Limited.
 */
import { DIDResolutionResult, VerificationMethod } from "did-resolver"
import { isAddress } from "ethers/lib/utils"

import { logger } from "../../logger"
import { didPkhResolver } from "../did"

/**
 * Convert the did to a blockchain address
 * @param did The did string
 */
export const convertDidToAddress = async (did: string): Promise<string> => {
  function isResolutionResultGood(
    didResult: DIDResolutionResult
  ): VerificationMethod | string {
    const verificationMethod: VerificationMethod | undefined =
      didResult.didDocument?.verificationMethod?.[0]
    if (didResult.didResolutionMetadata?.error || !verificationMethod) {
      const { error } = didResult.didResolutionMetadata
      return `DID resolve error: ${did}: ${error || "NA"}`
    } else {
      return verificationMethod
    }
  }

  const didResolutionResult: DIDResolutionResult = await didPkhResolver.resolve(
    did
  )
  const resultOrError = isResolutionResultGood(didResolutionResult)
  if (typeof resultOrError === "string") {
    logger.info("Failed to resolve did in pkh format", {
      did,
      didResult: JSON.stringify(didResolutionResult)
    })
    throw errorThrow(did)
  }
  const address = convertPkhToEtherAddress(resultOrError)

  if (address.errorMessage || !address.address) {
    logger.info("Failed to parse did", {
      did,
      errorMessage: address.errorMessage || "NA"
    })
    throw errorThrow(did)
  }

  return address.address
}

/**
 * EIP155 is ethereum:
 * https://github.com/w3c-ccg/did-pkh/blob/90b28ad3c18d63822a8aab3c752302aa64fc9382/did-pkh-method-draft.md
 *
 * The 2nd part is the chain ID reference string (ex. 1 = mainnet, 137 = polygon mainnet):
 * https://github.com/ChainAgnostic/CAIPs/blob/master/CAIPs/caip-2.md
 * Regex syntax: https://github.com/ChainAgnostic/CAIPs/blob/master/CAIPs/caip-2.md#syntax
 *
 * Address begin with 0x, and are followed by 40 alphanumeric characters:
 * https://metamask.zendesk.com/hc/en-us/articles/4702972178459-The-Ethereum-address-format-and-why-it-matters-when-using-MetaMask
 * Regex syntax: https://github.com/ChainAgnostic/CAIPs/blob/master/CAIPs/caip-10.md#syntax
 */
const pkhEthMainnetRegex = /eip155:([-a-zA-Z\d]{1,32}):(0x[a-fA-F\d]{1,64})/

interface BlockchainAddress {
  networkId?: string
  chainIdReference?: string
  address?: string

  errorMessage?: string
}

const errorThrow = (did: string): Error =>
  new Error(`Failed to parse did ${did}`)

function convertPkhToEtherAddress(
  verificationMethod: VerificationMethod
): BlockchainAddress {
  /**
   * The ID is validated and ID parts are filled into {@link VerificationMethod}.
   * By standard, it won't populate the address into the ethereumAddress field in {@link VerificationMethod}.
   * Instead, it populates the blockchainAccountId field, and we need to parse the address out from it.
   * https://github.com/w3c-ccg/did-pkh/blob/e608934faf0fdcf82023a830049dc821af1b6e90/test-vectors/did:pkh:eip155:1:0xb9c5714089478a327f09197987f16f9e5d936e8a.jsonld#L15
   */
  if (!verificationMethod.blockchainAccountId) {
    return {
      errorMessage:
        "DID resolve error: blockchainAccountId not found for did:pkh"
    }
  }
  const blockchainAccountId: string = verificationMethod.blockchainAccountId

  const pkhRexParts = pkhEthMainnetRegex.exec(blockchainAccountId)
  if (!pkhRexParts || pkhRexParts.length < 3) {
    return { errorMessage: `DID PKH parsing error. ID=${blockchainAccountId}` }
  }
  const chainIdReference: string = pkhRexParts[1]
  const ethAddress: string = pkhRexParts[2]
  if (!isAddress(ethAddress)) {
    logger.info(
      "Received PKH DID fits regex but failed in ether address validation.",
      { ethAddress, blockchainAccountId: blockchainAccountId }
    )
    return {
      errorMessage: `DID PKH address is not valid. ethAddress=${ethAddress}`
    }
  }

  return {
    networkId: "eip155",
    chainIdReference: chainIdReference,
    address: ethAddress
  }
}
