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

import { ApiClient, User } from "@prisma/client"

import prisma from "./prisma"

type CreateApiClientParams = {
  did: string
  expiresInSeconds: number
}

type FindActiveApiClientParams = {
  did: string
}

type FindApiClientParams = {
  id: string
}

type UpdateApiClientParams = {
  id: string
  data: {
    revokedAt?: Date
    revokedReason?: string
    revokedBy?: string
  }
}

export const createApiClient = async ({
  did,
  expiresInSeconds
}: CreateApiClientParams): Promise<ApiClient> => {
  return await prisma.apiClient.create({
    data: {
      user: {
        connect: {
          did
        }
      },
      expiresInSeconds
    }
  })
}

export const findActiveApiClients = async ({
  did
}: FindActiveApiClientParams): Promise<ApiClient[]> => {
  return await prisma.apiClient.findMany({
    where: {
      did,
      revokedAt: null
    }
  })
}

export const findApiClient = async (
  { id }: FindApiClientParams,
  includeUser = false
): Promise<ApiClient & { user: User }> => {
  return await prisma.apiClient.findUnique({
    where: {
      id
    },
    rejectOnNotFound: true,
    include: {
      user: includeUser
    }
  })
}

export const updateApiClient = async ({ id, data }: UpdateApiClientParams) => {
  if (Object.keys(data).length === 0) {
    throw new Error("Updating without new data")
  }

  return await prisma.apiClient.update({
    where: {
      id
    },
    data
  })
}
