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

import { ErrorRequestHandler } from "express"

import { logger } from "../logger"

import { errLog } from "./utils/catch-err"

/**
 * An abstract base Error class which contains an HTTP status code.
 */
abstract class ErrorWithStatus extends Error {
  httpStatus = 500
  details?: string
  additionalLoggingDetails?: string

  constructor(
    message?: string,
    details?: string,
    additionalLoggingDetails?: string
  ) {
    super(message)
    this.details = details
    this.additionalLoggingDetails = additionalLoggingDetails
  }
}

/**
 * An Error class which is used when a request is made to a resource which does
 * not exist.
 */
export class NotFoundError extends ErrorWithStatus {
  httpStatus = 404
}

/**
 * An Error class which is used when a bad request is made by the client.
 */
export class BadRequestError extends ErrorWithStatus {
  httpStatus = 400
}

export class UnauthorizedError extends ErrorWithStatus {
  httpStatus = 401
}

export class InternalServerError extends ErrorWithStatus {
  httpStatus = 500
  message = "Internal server error"
}

/**
 * Errors from body-parser
 *
 * https://github.com/expressjs/body-parser/blob/master/README.md#errors
 */
type BodyParserError = Error & {
  statusCode: number
  type: string
  expose: boolean
}

const isBodyParserError = (err: unknown): err is BodyParserError => {
  return (
    err instanceof Error &&
    "statusCode" in err &&
    "type" in err &&
    "expose" in err
  )
}

/**
 * Error Handling middleware which will catch all errors thrown by the application,
 * and respond with a consistent JSON message.
 *
 * Read more about Express error handling here:
 * https://expressjs.com/en/guide/error-handling.html
 */
export const errorHandler = (): ErrorRequestHandler => {
  return (err, _req, res, next) => {
    if (res.headersSent) {
      return next(err)
    }

    const shouldLog = process.env.NODE_ENV !== "test"

    if (err instanceof ErrorWithStatus) {
      res.status(err.httpStatus).json({
        status: err.httpStatus,
        errors: [{ message: err.message, details: err.details }]
      })
      if (shouldLog) {
        if (err.httpStatus == 500) {
          logger.error("Internal server error", {
            errMsg: err.message,
            errDetails: err.details,
            additionalDetails: err.additionalLoggingDetails,
            stack: err.stack
          })
        } else {
          logger.info(
            `Returning http status ${err.httpStatus}. ${err.message}`,
            {
              errDetails: err.details,
              additionalDetails: err.additionalLoggingDetails
            }
          )
        }
      }
    } else if (isBodyParserError(err) && err.expose) {
      res.status(err.statusCode).json({
        status: err.statusCode,
        errors: [{ message: err.message }]
      })
    } else {
      if (shouldLog) {
        const [message, context] = errLog("Internal server error", err)
        logger.error(message, context)
      }

      res.status(500).json({
        status: 500,
        errors: [
          {
            message: "Internal Server Error"
          }
        ]
      })
    }
  }
}
