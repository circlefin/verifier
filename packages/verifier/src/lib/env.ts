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
 * Returns the value for a given environment variable, otherwise returns the defaultValue if given or throws.
 *
 * @param variable name of the environment variable
 * @param defaultValue optional value to return if the variable is not found
 * @returns the environment variable, defaultValue, or throws
 */
export const env = (variable: string, defaultValue?: string) => {
  const value = process.env[variable]
  if (value === undefined) {
    if (defaultValue) {
      return defaultValue
    }
    throw new Error(`Missing environment variable: ${variable}`)
  }
  return value
}
