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

import { decodeJWT } from "did-jwt"
import type { Verifiable, W3CPresentation } from "did-jwt-vc"
import {
  verifyCredential,
  verifyPresentation,
  verifyPresentationPayloadOptions,
  normalizePresentation,
  validatePresentationPayload
} from "did-jwt-vc"
import type {
  JwtPresentationPayload,
  VerifyPresentationOptions
} from "did-jwt-vc/src/types"
import { UnsecuredJWT } from "jose"

import { logger } from "../logger"
import type {
  RevocableCredential,
  VerifiableCredential,
  VerifiablePresentation
} from "../types/credentials"

import { didResolver } from "./did"
import { BadRequestError } from "./errors"
import { errLog } from "./utils/catch-err"

type JWT = string

/**
 * Decode a JWT with a Verifiable Presentation payload.
 * Verifies and validates a VerifiablePresentation that is encoded as a JWT according to the W3C spec.
 *
 * @throws BadRequestError if the JWT is invalid
 */
export const decodeVerifiablePresentation = async (
  submission: JWT,
  options?: VerifyPresentationOptions
): Promise<VerifiablePresentation> => {
  try {
    logger.info("Verifying JWT VP")
    const res = await verifyPresentation(submission, didResolver, options)
    return res.verifiablePresentation
  } catch (err) {
    const [message, context] = errLog("JWT VP verification failed", err)
    logger.info(message, context)
    throw new BadRequestError(
      `Input isn't a valid Verifiable Presentation. ${context.errMsg || ""}`
    )
  }
}

/**
 * Verify and normalize a plaintext Verifiable Presentation payload.
 *
 * @throws BadRequestError if the JWT is invalid
 */
export const verifyVerifiablePresentation = (
  submission: JWT,
  options?: VerifyPresentationOptions
): VerifiablePresentation => {
  try {
    logger.info("Verifying plaintext VP")
    let presentation
    try {
      presentation = decodeJWT(submission).payload as JwtPresentationPayload
    } catch (err) {
      const [message, context] = errLog(
        "decodeJWT failed, falling back to UnsecuredJWT",
        err
      )
      logger.info(message, context)
      presentation = UnsecuredJWT.decode(submission)
        .payload as JwtPresentationPayload
    }

    verifyPresentationPayloadOptions(presentation, options || {})
    const normalizedPresentation: Verifiable<W3CPresentation> =
      normalizePresentation(presentation)
    validatePresentationPayload(normalizedPresentation)
    return normalizedPresentation
  } catch (err) {
    const [message, context] = errLog("Plaintext VP verification failed", err)
    logger.info(message, context)
    if (
      context.errMsg?.startsWith(
        "Presentation does not contain the mandatory challenge"
      )
    ) {
      throw new BadRequestError(
        "Input isn't a valid Verifiable Presentation. Nonce is invalid."
      )
    } else {
      throw new BadRequestError(
        `Input isn't a valid Verifiable Presentation. ${context.errMsg || ""}`
      )
    }
  }
}

/**
 * Decoded a JWT with a Verifiable Credential payload.
 *
 * @throws BadRequestError if the JWT is invalid
 */
export const decodeVerifiableCredential = async (
  vcJWT: JWT
): Promise<VerifiableCredential | RevocableCredential> => {
  try {
    const res = await verifyCredential(vcJWT, didResolver)
    return res.verifiableCredential
  } catch (err) {
    const [message, context] = errLog("VC decode failed", err)
    logger.info(message, context)
    if (context.errMsg && context.errMsg.includes("invalid_signature")) {
      throw new BadRequestError(
        "Input isn't a valid Verifiable Credential. Invalid signature."
      )
    } else {
      throw new BadRequestError(
        `Input isn't a valid Verifiable Credential. ${context.errMsg || ""}`
      )
    }
  }
}
