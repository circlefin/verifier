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

import { User } from "@prisma/client"

import prisma from "./prisma"

type CreateUserParams = {
  did: string
  legalTermVersion: number
}

type GetUserParams = {
  did: string
}

export const createUser = async ({
  did,
  legalTermVersion
}: CreateUserParams): Promise<User> => {
  return await prisma.user.create({
    data: {
      did,
      legalTermVersion
    }
  })
}

export const getUser = async ({ did }: GetUserParams): Promise<User> => {
  return await prisma.user.findUnique({
    where: {
      did
    },
    rejectOnNotFound: true
  })
}
