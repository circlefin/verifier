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

import { Response } from "express"
import asyncHandler from "express-async-handler"

import { BadRequestError } from "../../lib/errors"
import { revokeApiClient } from "../../lib/utils/api-clients"
import { logger } from "../../logger"

type Body = {
  revokedReason?: string
}

function validateBody(body: Body) {
  const { revokedReason } = body

  if (revokedReason && revokedReason.length > 200) {
    throw new BadRequestError("Revoked reason cannot exceed 200 char")
  }

  return body
}

export default asyncHandler(async (req, res: Response) => {
  const id = res.locals["id"] as string
  logger.info("Revoke", {
    id,
    ...(req.body as Body)
  })

  try {
    const { revokedReason } = validateBody(req.body as Body)

    const { revokedAt, revokedBy } = await revokeApiClient({
      id,
      revokedReason
    })

    res.status(200).json({
      id,
      revokedAt,
      revokedReason,
      revokedBy
    })
  } catch (err) {
    if (err instanceof BadRequestError) {
      err.additionalLoggingDetails = JSON.stringify(req.body as Body)
    }

    throw err
  }
})
