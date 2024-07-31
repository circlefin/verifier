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

import { v4 as uuidv4 } from "uuid"

import {
  createVerification,
  findVerification,
  saveSubmission
} from "../../../src/lib/database/verifications"
import { BadRequestError, NotFoundError } from "../../../src/lib/errors"
import { presentationDefinitionFactory } from "../../factories/presentation-definition"
import { decodedVerifiablePresentationFactory } from "../../factories/verifiable-presentation"
import { verificationFactory } from "../../factories/verification"

test("createVerification() creates a new verification", async () => {
  const network = "ethereum"
  const subject = "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266"
  const presentationDefinition = presentationDefinitionFactory()

  const result = await createVerification({
    network,
    subject,
    presentationDefinition,
    chainId: 1337
  })

  expect(result.id).toBeDefined()
  expect(result.challenge).toBeDefined()
  expect(result.status).toEqual("created")
  expect(result.network).toEqual(network)
  expect(result.subject).toEqual(subject)
  expect(result.chainId).toEqual(1337)
})

test("findVerification() fetches and returns a Verification record by id", async () => {
  const verification = await verificationFactory()

  const result = await findVerification(verification.id)

  expect(verification).toEqual(result)
})

test("findVerification() throws a NotFoundError when given an id that is not a uuid", async () => {
  await expect(findVerification("invalid")).rejects.toThrow(NotFoundError)
})

test("findVerification() throws a NotFoundError when given an id does not exist in the database", async () => {
  const id = uuidv4()

  await expect(findVerification(id)).rejects.toThrow(NotFoundError)
})

test("saveSubmission() updates a verification record with the submission", async () => {
  const credentialSubmission = await decodedVerifiablePresentationFactory()
  const verification = await verificationFactory()

  expect(verification.verifiedAt).toBeNull()

  const result = await saveSubmission({
    verification,
    submission: credentialSubmission,
    status: "approved"
  })

  expect(result.credentialSubmission).not.toBeNull()
  expect(result.verifiedAt).not.toBeNull()
})

test("saveSubmission() throws a BadRequestError when the submission has already been stored", async () => {
  const credentialSubmission = await decodedVerifiablePresentationFactory()
  const verification = await verificationFactory({ credentialSubmission })

  await expect(
    saveSubmission({
      verification,
      submission: credentialSubmission,
      status: "approved"
    })
  ).rejects.toThrow(BadRequestError)
})
