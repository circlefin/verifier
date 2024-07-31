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

import type { Verification } from "@prisma/client"
import { validate } from "uuid"

import type { VerifiablePresentation } from "../../types/credentials"
import type { VerificationResult } from "../../types/verification-result"
import { env } from "../env"
import { BadRequestError, NotFoundError } from "../errors"
import type { PresentationDefinition } from "../presentation-definition"

import prisma from "./prisma"

/**
 * Parameters for the `createVerification` method
 */
type CreateVerificationParams = {
  network: string
  subject: string
  name?: string
  version?: string
  chainId?: number
  registryAddress?: string
  presentationDefinition: PresentationDefinition
}

/**
 * Parameters for the `saveSubmission` method
 */
type SaveSubmissionParams = {
  verification: Verification
  submission: VerifiablePresentation
  verificationResult?: VerificationResult
  signature?: string
  status: string
  statusDetail?: string
}

/**
 * Create and persist a new Verification record for an end-user.
 *
 * This method is the first step in the verification process. The end-user will
 * be presented with a challengeTokenUrl which they will use to fetch this
 * verification offer.
 */
export const createVerification = async ({
  network,
  subject,
  chainId,
  registryAddress,
  name,
  version,
  presentationDefinition
}: CreateVerificationParams): Promise<Verification> => {
  return prisma.verification.create({
    data: {
      id: presentationDefinition.id,
      network,
      subject,
      name,
      version,
      chainId,
      registryAddress,
      presentationDefinition
    }
  })
}

/**
 * Find a Verification record in the database by its `id`.
 *
 * @throws NotFoundError if the verification is not found
 */
export const findVerification = async (id: string): Promise<Verification> => {
  if (!validate(id)) {
    throw new NotFoundError(`Verification not found for ${id}`)
  }

  try {
    return await prisma.verification.findUnique({
      where: {
        id
      },
      rejectOnNotFound: true
    })
  } catch (_err) {
    throw new NotFoundError(`Verification not found for ${id}`)
  }
}

// Force updating an already completed verification. This is mainly used for the load test.
const forceUpdateCompletedVerification: boolean =
  env("FORCE_UPDATE_COMPLETED_VERIFICATION", "false").toLowerCase() === "true"

/**
 * Store an end-user submission in the database. If the record already contains
 * a end-user submission, an error will be thrown.
 *
 * @throws BadRequestError if the submission has already been stored
 */
export const saveSubmission = async ({
  verification,
  submission,
  verificationResult,
  signature,
  status,
  statusDetail
}: SaveSubmissionParams) => {
  if (!forceUpdateCompletedVerification && verification.credentialSubmission) {
    throw new BadRequestError("Verification already complete")
  }

  return await prisma.verification.update({
    where: {
      id: verification.id
    },
    data: {
      credentialSubmission: submission,
      verificationResult,
      signature,
      status,
      statusDetail,
      verifiedAt: new Date()
    }
  })
}
