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

import type { VerifiableCredential } from "../../types/credentials"
import { BadRequestError } from "../errors"

import { convertDidToAddress } from "./didToAddressConverter"

/**
 * Confirm that the `holder` of the credential is also the subject of the
 * credential.  This is a naive implementation of the is_holder constraint.
 * Instead of honoring the Presentation Exchange is_holder constraint, we take a
 * more pragmatic approach and restrict usage to the holder.
 *
 * @throws {BadRequestError} if the holder is not the credential subject
 */
export const assertHolderIsSubject = (
  holder: string,
  credential: VerifiableCredential
): void => {
  if (holder !== credential.credentialSubject.id) {
    throw new BadRequestError("Presentation is not signed by the subject")
  }
}

/**
 * Confirm that the subject in the verification request matches the subject of the credential.
 * The subject in the verification request is provided in the `create` request payload, and it will be certified in the
 * VerificationResult if success. This subject is supposed to only submit its own credentials for verifying.
 * Therefore, it should match each credential's subject id.
 * @throws {BadRequestError} if not match
 */
export const assertCredentialSubjectMatchesRequest = async (
  requestSubjectAddress: string,
  credentialSubjectDid: string | undefined
): Promise<void> => {
  // sanity checks
  if (!credentialSubjectDid) {
    throw new BadRequestError(
      "Encountered invalid credential. Subject ID not found."
    )
  }

  let blockchainAddress: string
  try {
    blockchainAddress = await convertDidToAddress(credentialSubjectDid)
  } catch (e) {
    throw new BadRequestError(`Failed to parse did ${credentialSubjectDid}`)
  }

  if (blockchainAddress.toLowerCase() !== requestSubjectAddress.toLowerCase()) {
    throw new BadRequestError(
      `Credential subject does not match the subject in the verification request. ${blockchainAddress} is not equal to ${requestSubjectAddress}`
    )
  }
}
