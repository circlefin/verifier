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

export type ErrorLoggingContext = {
  errName?: string
  errMsg?: string
  stack?: string
  errString?: string
}

/**
 * Print the caught error instance with as much information as possible
 * @param message The prefix of the error message
 * @param err The caught error instance
 */
export function errLog(
  message: string,
  err: unknown
): [string, ErrorLoggingContext] {
  if (err instanceof Error) {
    return [
      message,
      {
        errName: err.name,
        errMsg: err.message,
        stack: err.stack
      }
    ]
  } else {
    const errString = err as string
    return [
      message,
      {
        errString
      }
    ]
  }
}
