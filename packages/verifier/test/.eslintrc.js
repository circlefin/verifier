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

/**
 * This file provides the test-specific ESLint configuration.
 *
 * This file extends the root-level config by setting the environment to be
 * `jest`, which declares a few global variables (such as `describe`, `test`,
 * `expect`, etc.). It also disables some rules that are in conflict with Jest
 * testing.
 *
 * ESLint will continue looking into parent folders for a .eslintrc.js file
 * until it finds one with `root: true`.
 */
module.exports = {
  env: {
    jest: true
  },
  rules: {
    "@typescript-eslint/no-unsafe-assignment": "off",
    "@typescript-eslint/no-unsafe-call": "off",
    "@typescript-eslint/no-unsafe-member-access": "off"
  }
}
