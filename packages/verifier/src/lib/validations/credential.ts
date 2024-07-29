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

/* eslint-disable import/no-named-as-default-member */
import Ajv from "ajv"
import jsonpath from "jsonpath"

import { logger } from "../../logger"
import type { VerifiableCredential } from "../../types/credentials"
import type {
  CredentialSubmission,
  InputDescriptorConstraintField
} from "../../types/presentation"
import { BadRequestError, InternalServerError } from "../errors"
import {
  InputDescriptor,
  PresentationDefinition,
  DES_ID_TO_CRED_TYPE
} from "../presentation-definition"
import { EntityAccInvAttestationSchema } from "../schemas/EntityAccInvAttestation"
import { KYBPAMLAttestationSchema } from "../schemas/KYBPAMLAttestation"

type Schema = Record<string, unknown>
type Attestation = Record<string, unknown>

/**
 * process url -> schema
 */
export const URL_TO_SCHEMA: { [x: string]: Schema } = {
  "https://verite.id/definitions/processes/kycaml/0.0.1/generic--usa-legal_person":
    KYBPAMLAttestationSchema as Schema,
  "https://raw.githubusercontent.com/centrehq/verite/d1b97b3a475aa00cf894f72213f34b7bcb8b3435/packages/docs/static/definitions/processes/kycaml/0.0.1/generic--usa-entity-accinv-all-checks":
    EntityAccInvAttestationSchema as Schema
}

/**
 * Load a Schema from the given URL.
 *
 * @throws BadRequestError if the schema is not found
 */
const findSchema = (uri: string): Schema => {
  if (uri in URL_TO_SCHEMA) {
    return URL_TO_SCHEMA[uri]
  }

  throw new BadRequestError(`Unknown schema: ${uri}`)
}

/**
 *
 *
 * @throws BadRequestError if the
 */
const assertCredentialAdheresToSchema = (
  ajv: Ajv,
  credential: VerifiableCredential,
  schema: Record<string, unknown>,
  credentialType: string
): void => {
  const attestation = credential.credentialSubject[credentialType] as
    | Attestation
    | undefined

  if (!attestation) {
    throw new BadRequestError(
      `No attestation of type ${credentialType} present in credential`
    )
  }

  let validate
  try {
    validate = ajv.compile(schema)
  } catch (error) {
    throw new BadRequestError("Schema is invalid")
  }
  const valid = validate(attestation)

  if (!valid && validate.errors) {
    const error = validate.errors[0]
    const errorMessage = `${
      error.instancePath ? error.instancePath : "input"
    } ${error.message ?? "is invalid"}`

    throw new BadRequestError(
      `Credential does not adhere to schema: ${errorMessage}`
    )
  }
}

/**
 * Find the first path in the input descriptor field which is present in the
 * credential.
 */
const findFirstMatchingPathForField = (
  field: InputDescriptorConstraintField,
  credential: VerifiableCredential
): unknown | undefined => {
  for (const path of field.path) {
    const value = jsonpath.query(credential, path)
    if (value.length) {
      return value[0]
    }
  }
}

/**
 * Validate a credential against a given input descriptor field constraints
 *
 * @throws BadRequestError if the credential does not satisfy the constraints
 */
const assertCredentialSatisfiesFieldConstraints = (
  ajv: Ajv,
  field: InputDescriptorConstraintField,
  credential: VerifiableCredential
): void => {
  const value = findFirstMatchingPathForField(field, credential)

  /**
   * If the field is not present in the credential, then the credential is not
   * valid.
   */
  if (!value) {
    /**
     * A "preferred" field is not required, so we can pass.
     */
    if (field.predicate === "preferred") {
      return
    }

    /**
     * This field is required and missing, throw an exception
     */
    throw new BadRequestError(
      `Credential is missing required field: ${field.purpose ?? field.id ?? ""}`
    )
  }

  /**
   * If the field is present in the credential, but the input descriptor `field`
   * has no `filter` (i.e. no constraints), then the credential is valid.
   */
  if (!field.filter) {
    // PASS, no filter / constraint. Anything is valid
    return
  }

  /**
   * If the field is present and there is a `filter`, validate the value in the
   * credential against the `filter`.
   */
  ajv.validate(field.filter, value)

  if (ajv.errors) {
    throw new BadRequestError(
      `Credential did not satisfy required constraint: ${field.purpose ?? ""}`
    )
  }
}

/**
 * Validate an input descriptor against the provided credentials. This will check
 * the adherence to the given schema, as well as to any other constraints, such
 * as the issuer being trusted, the credential being approved, etc.
 *
 * @throws BadRequestError if the credentials do not match the input descriptor
 */
const validateInputDescriptor = (
  inputDescriptor: InputDescriptor,
  credentials: VerifiableCredential[]
): void => {
  if (!(inputDescriptor.id in DES_ID_TO_CRED_TYPE)) {
    /**
     * At this point, the inputDescriptor ID had already been validated. It is expected to be able to be mapped to
     * a credentialType. It's a server error if it's not able to. This should never happen.
     */
    logger.error(
      `InputDescriptorId=${
        inputDescriptor.id
      } is included in the VerificationOffer but not registered in credentialTypeMap=${JSON.stringify(
        DES_ID_TO_CRED_TYPE
      )}`
    )
    throw new InternalServerError()
  }
  const credentialType: string = DES_ID_TO_CRED_TYPE[inputDescriptor.id]

  const constraints = inputDescriptor.constraints
  const fields = constraints?.fields

  /**
   * If there are no constraints for the input descriptor, then the credential
   * is valid.
   */
  if (!constraints || !fields || !fields.length) {
    return
  }

  const schemas = new Set<Schema>(
    inputDescriptor.schema.map(({ uri }) => findSchema(uri))
  )

  /**
   * Validate each credential against each of the constraints.
   */
  credentials.forEach((credential) => {
    /**
     * Verifiable presentation claims that this credential has the to-be-verified descriptor ID.
     * Verifiable offer defined its json path. The path should contain the expected credentialType.
     * Here we validate if this credential really has this credentialType.
     */
    if (!credential.type.find((t) => t === credentialType)) {
      throw new BadRequestError(
        `Submission claims having descriptorId ${inputDescriptor.id} but the matching type ${credentialType} does not exist in the credential`
      )
    }

    const ajv = new Ajv()

    /**
     * Validate the credential against the schema
     */
    schemas.forEach((schema) =>
      assertCredentialAdheresToSchema(ajv, credential, schema, credentialType)
    )

    fields.forEach((field) => {
      assertCredentialSatisfiesFieldConstraints(ajv, field, credential)
    })
  })
}

/**
 * Confirm the credential is valid and conforms to the Credential Offer and
 * matches the expected schema.
 *
 * Originally, this check will ensure the credential meets the minimum requirements
 * set forth in the request.
 *
 * But we relax on this check because we decide to implement verifier slightly different to the DIF definition.
 * More details can be found in:
 * https://circlepay.atlassian.net/jira/software/c/projects/VR/boards/429?modal=detail&selectedIssue=VR-122
 * In our implementation, we verify whatever the caller submitted.
 * In DIF, verifier is supposed to tell the caller what to upload for verification, and checks if this
 * presentation submission contains all the content that we earlier asked.
 *
 * @param presentation normalized user submission
 * @param presentationDefinition verification offer that we provided in an earlier request
 * @throws BadRequestError if the credential is not valid
 */
export const assertValidCredentialSubmission = (
  presentation: CredentialSubmission,
  presentationDefinition: PresentationDefinition
): void => {
  const inputDescriptors = presentationDefinition.input_descriptors ?? []
  const descriptorMap =
    presentation.presentation_submission?.descriptor_map ?? []

  // reject the submission if it contains unrecognized descriptor(s)
  const supportedSubjects: Set<string> = new Set(
    inputDescriptors.map((d) => d.id)
  )
  const unrecognizedSubject: string[] = descriptorMap
    .filter(({ id }) => !supportedSubjects.has(id))
    .map((d) => d.id)

  if (unrecognizedSubject.length) {
    throw new BadRequestError(
      `Encountered unrecognized subjects: ${JSON.stringify(
        unrecognizedSubject
      )}`
    )
  }

  /**
   * Validate each input descriptor against the credentials which satisfy it.
   */
  inputDescriptors.forEach((inputDescriptor) => {
    /**
     * Find the mapping to the credentials which satisfy this input descriptor.
     */
    const descriptor = descriptorMap.find(({ id }) => id === inputDescriptor.id)

    /**
     * If no credential matches this input descriptor, just skip.
     */
    if (!descriptor) {
      return
    }

    /**
     * We found one or more credentials matching the input descriptor. We now
     * pull these credentials from the location defined by the descriptor's
     * `path`.
     */
    const credentials = jsonpath.query(
      presentation,
      descriptor.path
    ) as VerifiableCredential[]

    /**
     * If no credential satisfies this input descriptor, then fail.
     */
    if (!credentials.length) {
      throw new BadRequestError(
        `No credentials satisfy input descriptor: ${
          inputDescriptor.name ?? inputDescriptor.id
        }`
      )
    }

    /**
     * Validate the input descriptor against the credentials which claim to
     * satisfy it.
     */
    validateInputDescriptor(inputDescriptor, credentials)
  })
}
