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

import asyncHandler from "express-async-handler"

import { BadRequestError } from "../../lib/errors"
import { getApiClients, maskApiToken } from "../../lib/utils/api-clients"

type Query = {
  did: string
}

function validateBody(query: Query) {
  const { did } = query

  if (!did) {
    throw new BadRequestError("Missing DID")
  }

  return query
}

export default asyncHandler(async (req, res) => {
  const { did } = validateBody(req.query as Query)

  const clients = (await getApiClients({ did })).map((c) => ({
    id: maskApiToken(c.id)
  }))
  res.status(200).json(clients)
})
