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

import { loadSecret } from "./ssm-client"

const PATH_TO_PRIVATE_KEY = "keyManagement/privateKeyHexString"

const loadPrivateKey = async () => {
  const privateKey = await loadSecret(PATH_TO_PRIVATE_KEY, true)

  if (privateKey) {
    process.env["VERIFIER_PRIVATE_KEY"] = privateKey
  } else {
    throw new Error("Private key not loaded")
  }
}

export { loadPrivateKey }
