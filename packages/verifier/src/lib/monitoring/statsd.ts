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

import { Request, Response, NextFunction } from "express"
import { StatsD } from "hot-shots"

import { logger } from "../../logger"
import { routeNameMapping } from "../routes"

import { statsDConfig } from "./config"

export const statsd = new StatsD({
  ...statsDConfig,
  errorHandler: function (error) {
    logger.warn("Socket errors caught here: ", error)
  }
})

export function statsDMiddleware() {
  return function (req: Request, res: Response, next: NextFunction) {
    const startTime = new Date().getTime()

    // Function called on response finish that sends stats to statsd
    function sendStats() {
      // eslint-disable-next-line
      const method = req.method?.toLowerCase()
      // eslint-disable-next-line
      const path: string = req.route?.path
      const routeKey = `${method}_${path}`
      const namedRoute = routeNameMapping[routeKey]
      // only for the routes we defined
      if (namedRoute) {
        const key = `${method}_${namedRoute}`
        // Status Code
        const statusCode = res.statusCode || "unknown_status"
        statsd.increment(`${key}_status_code_${statusCode}`)

        // Response Time
        const duration = new Date().getTime() - startTime
        statsd.timing(`${key}_response_time`, duration)
      }
      cleanup()
    }

    // Function to clean up the listeners we've added
    function cleanup() {
      res.removeListener("finish", sendStats)
      res.removeListener("error", cleanup)
      res.removeListener("close", cleanup)
      if (statsDConfig.mock) {
        // mockBuffer keeps increasing if not cleared https://github.com/brightcove/hot-shots
        statsd.mockBuffer = []
      }
    }

    // Add response listeners
    res.once("finish", sendStats)
    res.once("error", cleanup)
    res.once("close", cleanup)

    if (next) {
      next()
    }
  }
}
