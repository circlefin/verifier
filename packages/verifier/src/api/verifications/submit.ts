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

import asyncHandler from "express-async-handler"

import {
  findVerification,
  saveSubmission
} from "../../lib/database/verifications"
import { statsd } from "../../lib/monitoring"
import type { PresentationDefinition } from "../../lib/presentation-definition"
import { ethereum, solana } from "../../lib/results"
import { verify } from "../../lib/verifier"
import { logger } from "../../logger"

import { CredentialSubmission } from "src/types/presentation"

/**
 * POST /verifications/<id>
 *
 * Submit a verification submission. This is the step when a 3rd party service,
 * such as a wallet, submits credentials necessary to complete verification.
 */
export default asyncHandler(async (req, res) => {
  const verification = await findVerification(req.params.id)
  logger.info("Submit: start submit endpoint", {
    verifId: verification.id
  })

  const beforeVerify = new Date()
  const presentationDefinition =
    verification.presentationDefinition as PresentationDefinition
  const subject = verification.subject
  const { presentation } = await verify(
    presentationDefinition,
    req.body as string,
    subject,
    verification.challenge
  )
  statsd.timing("submit_verify", beforeVerify)

  const beforeSigning = new Date()
  const chainId = verification.chainId
  const registryAddress = verification.registryAddress
  const name = verification.name
  const version = verification.version
  const verifId = verification.id

  const idToSchemasMap = presentationDefinition.input_descriptors.reduce(
    (acc: Record<string, string[]>, input) => {
      acc[input.id] = input.schema.map((s) => s.uri)
      return acc
    },
    {}
  )
  const schema: Array<string> =
    (
      presentation as CredentialSubmission
    ).presentation_submission?.descriptor_map.reduce(
      (acc: Array<string>, desc) => {
        acc = [...acc, ...idToSchemasMap[desc.id]]
        return acc
      },
      []
    ) ?? []

  const result =
    verification.network === "solana"
      ? await solana({
          subject,
          chainId,
          name,
          version,
          verifier_verification_id: verifId,
          schema
        })
      : await ethereum({
          subject,
          chainId,
          registryAddress,
          name,
          version,
          verifier_verification_id: verifId,
          schema
        })
  statsd.timing("submit_signing", beforeSigning)

  logger.info("Submit: verified network", {
    verifId: verification.id,
    network: verification.network
  })

  const { verificationResult, signature } = result

  const beforeSavingSubmission = new Date()
  await saveSubmission({
    verification,
    submission: presentation,
    verificationResult,
    signature,
    status: "approved"
  })
  statsd.timing("submit_savingSubmission", beforeSavingSubmission)

  logger.info("Submit: saved submission", {
    verifId: verification.id
  })
  res.status(201).json({ status: "success", verificationResult, signature })
})
