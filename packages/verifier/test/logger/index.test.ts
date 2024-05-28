/*
 * Copyright (c) 2022, Circle Internet Financial Trading Company Limited.
 * All rights reserved.
 *
 * Circle Internet Financial Trading Company Limited CONFIDENTIAL
 * This file includes unpublished proprietary source code of Circle Internet
 * Financial Trading Company Limited, Inc. The copyright notice above does not
 * evidence any actual or intended publication of such source code. Disclosure
 * of this source code or any related proprietary information is strictly
 * prohibited without the express written permission of Circle Internet Financial
 * Trading Company Limited.
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
