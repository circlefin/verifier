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

import { logger } from "../logger"
import type {
  VerifiableCredential,
  VerifiablePresentation
} from "../types/credentials"

import {
  decodeVerifiableCredential,
  verifyVerifiablePresentation
} from "./coder"
import { BadRequestError } from "./errors"
import { statsd } from "./monitoring"
import { PresentationDefinition } from "./presentation-definition"
import { asyncEach } from "./utils/async-fns"
import { assertValidCredentialSubmission } from "./validations/credential"
import { assertNotExpired } from "./validations/expiry"
import { assertNotRevoked } from "./validations/revocation"
import { assertCredentialSubjectMatchesRequest } from "./validations/subject"

/**
 * Decode an encoded JWT and verify the submission
 *
 * @throws BadRequestError if the submission is invalid (malformed JWT, failed validation, etc)
 */
export const verify = async (
  presentationDefinition: PresentationDefinition,
  submission: string,
  subject: string,
  challenge?: string
): Promise<{
  presentation: VerifiablePresentation
}> => {
  // Verify the VP
  const beforeVerifyVp = new Date()
  const vpVerificationOption = { challenge }
  const presentation = verifyVerifiablePresentation(
    submission,
    vpVerificationOption
  )
  statsd.timing("submit_verify_verifyVp", beforeVerifyVp)
  const verificationId = presentationDefinition.id || "invalid_id"
  const logContext = { verifId: verificationId }
  logger.info("VP verified", logContext)

  const verifiableCredentials = [presentation.verifiableCredential]
    .flat()
    .filter(Boolean) as VerifiableCredential[]

  /**
   * Ensure the verifiable presentation contains at least one verifiable
   * credential.
   */
  if (verifiableCredentials.length === 0) {
    throw new BadRequestError(
      "No Verifiable Credential provided",
      "",
      JSON.stringify(logContext)
    )
  }

  await asyncEach(verifiableCredentials, async (verifiableCredential) => {
    const vcLogContext = {
      verifId: verificationId,
      vcMeta: verifiableCredential.vc as unknown
    }

    try {
      /**
       * Verify the signature of the VC JWT, then its content after decoding.
       */
      const beforeDecodeVc = new Date()
      await decodeVerifiableCredential(verifiableCredential.proof.jwt as string)
      statsd.timing("submit_verify_decodeVc", beforeDecodeVc)
      logger.debug("VC signature verified", vcLogContext)

      /**
       * Ensure this Verifiable Credential is not expired.
       *
       * Generally, the JWT verification itself would handle this by checking the
       * `exp` field of the JWT, but those JWT properties are only checked on the
       * Presentation JWT, and not on the included credentials themselves during
       * the `decodeVerifiablePresentation()` call.
       *
       * The `verifyCredential()` call inside `decodeVerifiableCredential()` only
       * checks the time format, not expiration.
       *
       * To ensure we do not use any expired credentials, we check this ourselves
       * here.
       */
      assertNotExpired(verifiableCredential)
      logger.debug("VC expiration verified", vcLogContext)

      /**
       * Ensure this Verifiable Credential is issued to the subject in the verification request.
       */
      await assertCredentialSubjectMatchesRequest(
        subject,
        verifiableCredential.credentialSubject.id
      )
      logger.debug("VC subject verified", vcLogContext)

      /**
       * Ensure this Verifiable Credential is not revoked.
       *
       * To check revocation status, we must either have a local cached copy of
       * the revocation list, or fetch the list from the location described in the
       * credential.
       *
       */
      const beforeAssertRevoked = new Date()
      await assertNotRevoked(verifiableCredential)
      statsd.timing("submit_verify_revocation", beforeAssertRevoked)

      logger.debug("VC revocation status verified", vcLogContext)
    } catch (err) {
      if (err instanceof BadRequestError) {
        err.additionalLoggingDetails = JSON.stringify(vcLogContext)
      }
      throw err
    }
  })

  /**
   * Validate each descriptor in the credential
   */
  const beforeAssertVcSchema = new Date()
  assertValidCredentialSubmission(presentation, presentationDefinition)
  statsd.timing("submit_verify_assertVcSchema", beforeAssertVcSchema)
  logger.debug("VC schema verified", logContext)

  logger.info("VC verified", logContext)
  return {
    presentation
  }
}
