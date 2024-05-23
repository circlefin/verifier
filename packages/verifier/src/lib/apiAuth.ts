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

import { NextFunction, Request, Response } from "express"
import asyncHandler from "express-async-handler"

import { logger } from "../logger"

import { routeNameMapping } from "./routes"
import { isValidAuth } from "./utils/auth"

export default asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const id = (req.header("X-API-Key") as string) || ""

    try {
      // eslint-disable-next-line
      const method = req.method?.toLowerCase()
      // eslint-disable-next-line
      const path: string = req.route?.path
      const routeKey = `${method}_${path}`
      const namedRoute = routeNameMapping[routeKey]

      if (!["create", "show", "submit", "status"].includes(namedRoute)) {
        // Enforce in https://circlepay.atlassian.net/browse/VR-199
        const apiClient = await isValidAuth({ id })
        logger.info(`${namedRoute} request with ${apiClient.did}`)
      }

      // Next request can access the parsed DID
      res.locals["id"] = id
    } catch (err) {
      if (next) {
        next(err)
        return
      }
    }

    if (next) {
      next()
    }
  }
)
