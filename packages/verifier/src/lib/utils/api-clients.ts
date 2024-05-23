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

import { PrismaClientKnownRequestError } from "@prisma/client/runtime"

import {
  createApiClient,
  findActiveApiClients,
  findApiClient,
  updateApiClient
} from "../database/apiClient"
import { BadRequestError, NotFoundError } from "../errors"

const EXPIRES_IN_SECONDS = 2147483647

type GenerateApiClientParams = {
  did: string
}

type RevokeApiTokenParams = {
  id: string
  revokedReason?: string
}

type GetApiClientsParams = {
  did: string
}

/**
 * Create api token for a given DID
 * Each did should only have 1 active api token at a time
 */
export const generateApiClient = async ({ did }: GenerateApiClientParams) => {
  try {
    return await createApiClient({
      did,
      expiresInSeconds: EXPIRES_IN_SECONDS
    })
  } catch (err) {
    if (err instanceof PrismaClientKnownRequestError) {
      if (err.code === "P2025") {
        throw new BadRequestError("Cannot create API client without valid user")
      }
    }

    throw err
  }
}

/**
 *  Revoke api token if it exist and has not been revoked yet
 *
 */
export const revokeApiClient = async ({
  id,
  revokedReason
}: RevokeApiTokenParams) => {
  try {
    const apiClient = await findApiClient({ id })

    if (apiClient.revokedAt) {
      throw new BadRequestError("ApiClient has already been revoked")
    }

    const data = {
      revokedAt: new Date(),
      revokedBy: apiClient.did
    }

    if (revokedReason) {
      Object.assign(data, {
        revokedReason
      })
    }

    return await updateApiClient({
      id,
      data
    })
  } catch (err) {
    if (err instanceof PrismaClientKnownRequestError) {
      if (err.code === "P2023") {
        throw new NotFoundError("Cannot find api client to revoke")
      }
    }

    throw err
  }
}

export const getApiClients = async ({ did }: GetApiClientsParams) => {
  return await findActiveApiClients({ did })
}

export const maskApiToken = (id: string) => {
  return `${id.slice(0, -4).replace(/[a-zA-Z0-9_]/g, "*")}${id.slice(-4)}`
}
