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

import https from "https"

import { BitBuffer } from "bit-buffers"
import { has } from "lodash"
import type { Response } from "node-fetch"
import fetch from "node-fetch"

import { logger } from "../../logger"
import type {
  RevocableCredential,
  RevocationListCredential,
  VerifiableCredential
} from "../../types/credentials"
import { decodeVerifiableCredential } from "../coder"
import { BadRequestError } from "../errors"
import { statsd } from "../monitoring"
import { errLog } from "../utils/catch-err"

/**
 * Determine if a given credential is revocable or not.
 *
 * @returns true if the credential is revocable, false otherwise
 */
const isRevocable = (
  credential: VerifiableCredential | RevocableCredential
): credential is RevocableCredential => {
  return has(credential, "credentialStatus.statusListIndex")
}

/**
 * Performs an HTTP request to fetch the revocation status list for a credential.
 *
 * @returns the encoded status list, if present
 */
const fetchStatusList = async (
  credential: RevocableCredential
): Promise<RevocationListCredential> => {
  const [url, httpsAgent] = getStatusListCredentialUrl(
    credential.credentialStatus.statusListCredential
  )
  let response: Response
  try {
    const beforeFetchRevocation = new Date()
    // eslint-disable-next-line
    response = await fetch(url, {
      method: "GET",
      agent: httpsAgent
    })
    statsd.timing("submit_verify_fetchRevocation", beforeFetchRevocation)
  } catch (err) {
    const [message, context] = errLog(
      `Failed to fetch statusListCredential=${url}`,
      err
    )
    logger.info(message, context)
    throw new BadRequestError("StatusListCredential URL is not reachable.")
  }

  if (response.status === 200) {
    const beforeDecodeRevocation = new Date()
    const vcJwt = await response.text()
    const revocationListCredential = decodeVerifiableCredential(
      vcJwt
    ) as Promise<RevocationListCredential>
    statsd.timing("submit_verify_decodeRevocation", beforeDecodeRevocation)
    return revocationListCredential
  } else {
    logger.info(
      `Revocation status url returned non-200 http code. url=${url}, httpCode=${response.status}`
    )
    throw new BadRequestError(
      "Response from StatusListCredential URL is invalid."
    )
  }
}

/**
 * Compose a statusListDomainMap from the env variable
 */
export const statusListDomainMapFunc = (
  statusListDomainMapStr?: string
): { [x: string]: string } => {
  if (statusListDomainMapStr) {
    const statusListDomainMap: { [x: string]: string } = {}
    statusListDomainMapStr.split(",").forEach((entry) => {
      const kv: string[] = entry.split("=")
      statusListDomainMap[kv[0]] = kv[1]
    })
    logger.info(`StatusListDomainMap=${JSON.stringify(statusListDomainMap)}`)
    return statusListDomainMap
  } else {
    return {}
  }
}
const statusListDomainMap: { [x: string]: string } = statusListDomainMapFunc(
  process.env.STATUS_LIST_INTERNAL_DOMAIN_MAP
)

/**
 * HTTPS agent that is used for external resource on the Internet.
 */
const httpsAgent = new https.Agent({
  rejectUnauthorized: true,
  keepAlive: true,
  timeout: 30000
})
/**
 * HTTPS agent that is used for internal resource, most likely the Issuer. Keep a longer connection.
 */
const internalHttpsAgent = new https.Agent({
  rejectUnauthorized: false,
  keepAlive: true,
  timeout: 90000
})

/**
 * Get the url that will be used to fetch the status list credential
 */
export const getStatusListCredentialUrl = (
  urlStr: string,
  internalDomainMap: { [x: string]: string } = statusListDomainMap
): [string, https.Agent] => {
  let agent = httpsAgent
  if (!internalDomainMap) {
    return [urlStr, agent]
  }
  const url = new URL(urlStr)
  if (url.host in internalDomainMap) {
    url.host = internalDomainMap[url.host]
    agent = internalHttpsAgent
  }
  return [url.href, agent]
}

/**
 * Determine if a revocable credential has already been revoked. This method will
 * fetch an external status list if no one is provided
 *
 * If we are unable to load the status list, we have to assume this credential is invalid.
 *
 * @returns whether or not the credential has been revoked
 */
const isRevoked = async (
  credential: RevocableCredential,
  revocationStatusList?: RevocationListCredential
): Promise<boolean> => {
  const statusList = revocationStatusList ?? (await fetchStatusList(credential))

  if (!statusList.credentialSubject.encodedList) {
    throw new BadRequestError(
      "Response from StatusListCredential URL is invalid."
    )
  }

  const encodedList = statusList.credentialSubject.encodedList
  const index = parseInt(credential.credentialStatus.statusListIndex, 10)

  return isBitRevoked(encodedList, index)
}

/**
 * Check the bit in the revocation string to determine the revocation status.
 * @param bitString The encodedList field in credentialSubject which is returned from issuer
 * @param index The offset of the bit as stored in the statusListIndex field of credentialStatus, which is in the VC
 */
export const isBitRevoked = (bitString: string, index: number): boolean => {
  const bitBuffer = BitBuffer.fromBitstring(bitString)
  return bitBuffer.test(index)
}

/**
 * Confirm the credential is not revoked. If the credential contains an
 * `expirationDate` field, we confirm the credential is still valid.
 *
 * @throws BadRequestError if the credential is expired
 */
export const assertNotRevoked = async (
  credential: VerifiableCredential | RevocableCredential,
  revocationStatusList?: RevocationListCredential
): Promise<void> => {
  if (!isRevocable(credential)) {
    return
  }

  const revoked = await isRevoked(credential, revocationStatusList)

  if (revoked) {
    throw new BadRequestError("Credential has been revoked.")
  }
}
