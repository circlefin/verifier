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

import { Verifiable, W3CCredential, W3CPresentation } from "did-jwt-vc"

export type StatusList2021Entry = {
  id: string
  type: "StatusList2021Entry"
  statusListIndex: string
  statusListCredential: string
}

export type StatusList2021EntrySubject = {
  id: string
  type: "StatusList2021Entry"
  encodedList: string
}

export type Revocable<T> = T & {
  readonly credentialStatus: StatusList2021Entry
}

export type RevocationList<T> = T & {
  id: string
  readonly credentialSubject: StatusList2021EntrySubject
}

export type VerifiablePresentation = Verifiable<W3CPresentation>
export type VerifiableCredential = Verifiable<W3CCredential>
export type RevocableCredential = Revocable<VerifiableCredential>
export type RevocationListCredential = RevocationList<VerifiableCredential>
export type EncodedRevocationListCredential = string
