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

import { env } from "../../src/lib/env"

test("env() returns an existing environment variable", () => {
  const value = env("NODE_ENV")
  expect(["test", "development", "production"]).toContain(value)
})

test("env() returns a fallback for a missing env variable if one is present", () => {
  const value = env("MISSING_ENV_VAR", "development")
  expect(value).toBe("development")
})

test("env() throws an error if the environment variable is not set, and there is no fallback", () => {
  expect(() => {
    env("MISSING_ENV_VAR")
  }).toThrowErrorMatchingInlineSnapshot(
    `"Missing environment variable: MISSING_ENV_VAR"`
  )
})
