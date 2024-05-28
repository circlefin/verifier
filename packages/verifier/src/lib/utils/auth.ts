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

import { findApiClient } from "../database/apiClient"
import { UnauthorizedError } from "../errors"

import { isOnLatestLegalTerm } from "./user"

type ValidApiTokenParams = {
  id: string
}

/**
 * Returns True if the api token
 * 1) matches the did
 * 2) has not expired
 * 3) has not revoked
 * 4) is on the latest legal term version
 */
export const isValidAuth = async ({ id }: ValidApiTokenParams) => {
  if (!id) {
    throw new UnauthorizedError("Missing API token")
  }

  let apiClient

  try {
    apiClient = await findApiClient({ id }, true)
  } catch (err) {
    throw new UnauthorizedError("ApiClient cannot be found")
  }

  const expiryInMs = apiClient.expiresInSeconds * 1000
  if (Date.now() > apiClient.createdAt.getTime() + expiryInMs) {
    throw new UnauthorizedError("ApiClient has already expired")
  }

  if (apiClient.revokedAt) {
    throw new UnauthorizedError("ApiClient has already been revoked")
  }

  if (!isOnLatestLegalTerm(apiClient.user)) {
    throw new UnauthorizedError("ApiClient is not on latest legal term version")
  }

  return apiClient
}
