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

import express from "express"
import request from "supertest"

import {
  BadRequestError,
  errorHandler,
  NotFoundError
} from "../../src/lib/errors"

test("errors allow a message with optional details", async () => {
  const app = express()
  app.use(() => {
    throw new BadRequestError("Message", "Optional details")
  })
  app.use(errorHandler())

  const { statusCode, body } = await request(app).get("/")
  expect(statusCode).toBe(400)
  expect(body).toEqual({
    status: 400,
    errors: [{ message: "Message", details: "Optional details" }]
  })
})

test("errorHandler() middleware returns a 500 on unknown thrown error", async () => {
  const app = express()
  app.use(() => {
    throw new BadRequestError("Bad Request")
  })
  app.use(errorHandler())

  const { statusCode, body } = await request(app).get("/")
  expect(statusCode).toBe(400)
  expect(body).toEqual({ status: 400, errors: [{ message: "Bad Request" }] })
})

test("errorHandler() middleware handles known Errors", async () => {
  const app = express()
  app.use(() => {
    throw new NotFoundError("Not Found")
  })
  app.use(errorHandler())

  const { statusCode, body } = await request(app).get("/")
  expect(statusCode).toBe(404)
  expect(body).toEqual({ status: 404, errors: [{ message: "Not Found" }] })
})

test("errorHandler() middleware returns a 500 on unknown thrown error", async () => {
  const app = express()
  app.use(() => {
    throw new Error()
  })
  app.use(errorHandler())

  const { statusCode, body } = await request(app).get("/")
  expect(statusCode).toBe(500)
  expect(body).toEqual({
    status: 500,
    errors: [{ message: "Internal Server Error" }]
  })
})

test("errorHandler() middleware properly handles cases where the response has already been sent", async () => {
  const app = express()
  app.use((_req, res) => {
    res.sendStatus(200)
    throw new Error()
  })
  app.use(errorHandler())

  const { statusCode } = await request(app).get("/")
  expect(statusCode).toBe(200)
})
