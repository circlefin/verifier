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

import type { VerifiableCredential } from "../../types/credentials"
import { BadRequestError } from "../errors"

/**
 * Confirm the credential is not expired. If the credential contains an `expirationDate` field,
 * we confirm the credential is still valid.
 *
 * @throws BadRequestError if the credential is expired
 */
export const assertNotExpired = (credential: VerifiableCredential): void => {
  if (credential.expirationDate) {
    const expirationDate = new Date(credential.expirationDate)
    if (expirationDate < new Date()) {
      throw new BadRequestError("Credential has expired.")
    }
  }
}
