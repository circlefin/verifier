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

import path from "path"

import bodyParser from "body-parser"
import cors from "cors"
import express, { Request, Response, static as s } from "express"
import helmet from "helmet"
import morgan from "morgan"

import { errorHandler } from "./lib/errors"
import { statsDMiddleware } from "./lib/monitoring"
import { routes } from "./lib/routes"
import { loadPrivateKey } from "./lib/utils/key-management-client"
import { logger } from "./logger"

export const app = express()

app.set("view engine", "ejs")
app.use(s(path.join(__dirname + "views")))
app.use("/css", s(path.join(__dirname, "views/css")))
app.use("/img", s(path.join(__dirname, "views/img")))
app.use("/js", s(path.join(__dirname, "views/js")))

if (process.env.NODE_ENV !== "test") {
  // refer to https://github.com/expressjs/morgan#tokens for the tokens
  const morganFormat: morgan.FormatFn<Request, Response> = function (
    tokens,
    req,
    res
  ) {
    const log = {
      contentLength: tokens.res(req, res, "content-length"),
      logger: "accessLog",
      method: tokens.method(req, res),
      protocol: tokens["http-version"](req, res),
      service: `${process.env.ENV ?? "unknown"}.${
        process.env.SERVICE_NAME ?? "service"
      }`,
      status: tokens.status(req, res),
      timestamp: tokens.date(req, res, "iso"), // does not support timestamp out of the box
      uri: tokens.url(req, res),
      userAgent: tokens["user-agent"]
    }
    return JSON.stringify(log)
  }
  // refer to https://github.com/expressjs/morgan#options
  const morganOptions: morgan.Options<Request, Response> = {
    immediate: false
  }
  app.use(morgan(morganFormat, morganOptions))
} // disable for unit tests
app.use(cors())
app.use(
  helmet({
    crossOriginEmbedderPolicy: false
  })
)
app.use(bodyParser.text())
app.use(bodyParser.json())
app.use(statsDMiddleware())

if (process.env.NODE_ENV === "production") {
  // Only load from Secret Manager if production
  loadPrivateKey()
    .then(() => {
      app.use(routes)
      app.use(errorHandler())
    })
    .catch((err) => logger.error(err))
} else {
  app.use(routes)
  app.use(errorHandler())
}
