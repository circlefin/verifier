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
import { PrismaClientKnownRequestError } from "@prisma/client/runtime"

import { createUser, getUser } from "../database/user"
import { BadRequestError, NotFoundError } from "../errors"

const MIN_LEGAL_TERM_VERSION = 1

type CreateUserParams = {
  did: string
}

type GetUserParams = {
  did: string
}

export const createNewUser = async ({ did }: CreateUserParams) => {
  try {
    return await createUser({
      did,
      legalTermVersion: MIN_LEGAL_TERM_VERSION
    })
  } catch (err) {
    if (err instanceof PrismaClientKnownRequestError && err.code === "P2002") {
      throw new BadRequestError("User with DID already exists")
    }
    throw err
  }
}

export const getExistingUser = async ({ did }: GetUserParams) => {
  try {
    return await getUser({ did })
  } catch (err) {
    if (err instanceof Error && err.name === "NotFoundError") {
      throw new NotFoundError("Cannot find user")
    }

    throw err
  }
}

export const isOnLatestLegalTerm = (user: User) => {
  return user.legalTermVersion >= MIN_LEGAL_TERM_VERSION
}
