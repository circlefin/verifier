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

import { BadRequestError } from "../../lib/errors"
import { createNewUser } from "../../lib/utils/user"
import { logger } from "../../logger"

const DOMAIN_REGEX = new RegExp(
  "^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:.[a-zA-Z]{2,})+$"
)

type Body = {
  did: string
}

function validateBody(body: Body) {
  const { did } = body

  const parts = (did || "").split(":")
  if (parts.length < 3 || parts[0] != "did") {
    throw new BadRequestError("Sign up with an invalid did")
  }

  if (parts[1] != "web") {
    throw new BadRequestError("Sign up only supports did:web")
  }

  if (parts[2].length > 253 || !DOMAIN_REGEX.test(parts[2])) {
    throw new BadRequestError("Sign up with an invalid domain")
  }

  if (/(circle.com)/gi.test(parts[2])) {
    throw new BadRequestError("Cannot use Circle DID")
  }

  return body
}

export default asyncHandler(async (req, res) => {
  logger.info("CreateUser", req.body as Body)

  const { did } = validateBody(req.body as Body)

  const user = await createNewUser({ did })

  res.status(200).json({
    did: user.did
  })
})
