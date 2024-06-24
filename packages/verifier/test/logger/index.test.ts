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

import { jsonReplacer } from "../../src/logger"

test("metadata should only allow 1 layer of string values", () => {
  const logEntry = {
    level: "info",
    message: "foo message",
    metadata: {
      numKey: 1,
      boolKey: true,
      objKey: {
        nestedIntKey: 2,
        nestedBoolKey: true,
        nestedStrKey: "nested message",
        objObjKey: {
          nestedIntKey2: 3,
          nestedBoolKey2: true,
          nestedStrKey2: "double nested message"
        }
      },
      arrKey: [{ arrNestedKey: "array nested message" }, 2]
    }
  }
  const logContextStr = JSON.stringify(logEntry, jsonReplacer)
  const logContext = JSON.parse(logContextStr)
  const metadataObj = logContext["metadata" as keyof typeof logContext]
  expect(typeof metadataObj["numKey" as keyof typeof metadataObj]).toEqual(
    "string"
  )
  expect(typeof metadataObj["boolKey" as keyof typeof metadataObj]).toEqual(
    "string"
  )
  expect(typeof metadataObj["objKey" as keyof typeof metadataObj]).toEqual(
    "string"
  )
  expect(typeof metadataObj["arrKey" as keyof typeof metadataObj]).toEqual(
    "string"
  )
})
