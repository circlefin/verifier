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

import { VerifiablePresentation } from "./credentials"

type DescriptorMap = {
  id: string
  format: "jwt" | "jwt_vc" | "jwt_vp" | "ldp_vc" | "ldp_vp" | "ldp"
  path: string
  path_nested?: DescriptorMap
}

export type CredentialSubmission = VerifiablePresentation & {
  presentation_submission?: {
    id: string
    definition_id: string
    descriptor_map: DescriptorMap[]
  }
}

type InputDescriptorConstraintFilter = {
  type: string
  format?: string
  pattern?: string
  minimum?: string | number
  minLength?: number
  maxLength?: number
  exclusiveMinimum?: string | number
  exclusiveMaximum?: string | number
  maximum?: string | number
  const?: string | number
  enum?: string[] | number[]
  not?: InputDescriptorConstraintFilter
}

export type InputDescriptorConstraintField = {
  path: string[]
  id?: string
  purpose?: string
  filter?: InputDescriptorConstraintFilter
  predicate?: "required" | "preferred"
}
