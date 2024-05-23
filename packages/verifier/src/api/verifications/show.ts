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

import { findVerification } from "../../lib/database/verifications"
import { PresentationDefinition } from "../../lib/presentation-definition"
import { url } from "../../lib/url-fns"
import { logger } from "../../logger"

const ONE_MONTH = 1000 * 60 * 60 * 24 * 30

/**
 * GET /verifications/:id
 *
 * Load the Verification from the database and respond with a verification
 * offer.
 */
export default asyncHandler(async (req, res) => {
  const verification = await findVerification(req.params.id)
  logger.info("Show: start show endpoint", {
    verifId: verification.id
  })

  const offer = {
    id: verification.id,
    type: "https://circle.com/types/VerificationRequest",
    from: "did:web:circle.com",
    created_time: new Date(verification.offeredAt).toISOString(),
    expires_time: new Date(
      verification.offeredAt.getTime() + ONE_MONTH
    ).toISOString(),
    reply_url: url(`/api/v1/verifications/${verification.id}`),
    body: {
      status_url: url(`/api/v1/verifications/${verification.id}/status`),
      challenge: verification.challenge
    }
  }

  res.status(200).json(offer)
})
