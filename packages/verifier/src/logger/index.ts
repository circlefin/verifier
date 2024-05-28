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

/* eslint-disable */
import winston, { createLogger } from "winston"
import Transport from "winston-transport"

const { combine, timestamp, json, uncolorize, metadata, errors } =
  winston.format
const { MESSAGE } = require("triple-beam")

// This transport is to redirect a certain level of log to the debug console. It is only used for local dev for convenience.
class ConsoleTeeTransport extends Transport {
  log(info: any, callback: () => void) {
    setImmediate(() => this.emit("logged", info))

    console.log(info[MESSAGE])

    if (callback) {
      callback()
    }
  }
}

const timestampFieldKey = "timestamp"
const serviceFieldKey = "service"
const defaultMetaObject: { [key: string]: string } = {}
defaultMetaObject[serviceFieldKey] = `${process.env.ENV ?? "unknown"}.${
  process.env.SERVICE_NAME ?? "service"
}`
export const jsonReplacer: (this: any, key: string, value: any) => any = (
  k,
  v
) => {
  if (k === "metadata") {
    // Only allow 1 layer of metadata. All values in the metadata object should be string type.
    // Motivation: Changing Elasticsearch field type will cause type conflict exception including object and array types.
    // https://discuss.elastic.co/t/kibana-conflict-type-field/270667/4
    Object.keys(v).forEach(function (vKey, idx) {
      if (typeof v[vKey] !== "string") {
        v[vKey] = JSON.stringify(v[vKey])
      }
    })
  }
  return v
}

const defaultLoggerOptions: winston.LoggerOptions = {
  level: "info",
  format: combine(
    uncolorize(), // colorized logging cause problem in ES
    timestamp({
      alias: timestampFieldKey,
      format: new Date().toISOString()
    }),
    metadata({
      key: "metadata",
      // avoid using these keywords for context key
      fillExcept: ["message", "level", serviceFieldKey, timestampFieldKey]
    }),
    errors({ stack: true }),
    json({
      replacer: jsonReplacer
    })
  ),
  defaultMeta: defaultMetaObject
}

let transports: winston.transport[]
switch (process.env.NODE_ENV) {
  case "production": {
    transports = [new winston.transports.Console({})]
    break
  }
  case "test": {
    transports = [new winston.transports.Console({ silent: true })]
    break
  }
  default: {
    // === "development"
    transports = [new ConsoleTeeTransport({})]
    break
  }
}

export const logger = createLogger({
  ...defaultLoggerOptions,
  transports: transports
})
