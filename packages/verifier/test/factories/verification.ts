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

import { Verification } from "@prisma/client"
import { v4 } from "uuid"

import prisma from "../../src/lib/database/prisma"

import { ETH_ADDRESS } from "./did"
import { presentationDefinitionFactory } from "./presentation-definition"

export const verificationFactory = async (
  props: Partial<Verification> = {}
): Promise<Verification> => {
  const presentationDefinition = presentationDefinitionFactory()

  return prisma.verification.create({
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    data: Object.assign(
      {
        id: presentationDefinition.id,
        challenge: v4(),
        network: "ethereum",
        chainId: 1337,
        subject: ETH_ADDRESS,
        presentationDefinition,
        offeredAt: new Date(),
        status: "created"
      },
      props
    )
  })
}
