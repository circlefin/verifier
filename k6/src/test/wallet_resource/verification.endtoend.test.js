/*
 * Copyright 2024 Circle Internet Financial, LTD.  All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at

 * http://www.apache.org/licenses/LICENSE-2.0

 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.

 * SPDX-License-Identifier: Apache-2.0
 */

import test_config from "test_config";
import { rand } from "loadtest-common/common";
import {
  create,
  generateSubmitBody,
  getCredential,
  offer,
  submit,
} from "./verification.utils";

const testConfig = test_config.tests.verification.end_to_end;

export const options = testConfig.k6_options;

export function setup() {
  console.info("Running setup..");
  console.info(`Creating ${testConfig.verifiable_credential_count} requests.`);
  const credentials = [];
  for (let i = 0; i < testConfig.verifiable_credential_count; i++) {
    const credential = getCredential();
    console.info(`Credential generated #${i}:\n${credential}\n`);
    credentials.push(credential);
  }
  console.info("Setup done");
  return credentials;
}

/**
 * Load test verification end to end
 */
export default function (credentials) {
  const credential = rand(credentials);
  const challengeTokenUrl = create();
  const { verificationId, challenge } = offer(challengeTokenUrl);
  const verificationBodyJwt = generateSubmitBody(
    credential,
    verificationId,
    challenge
  );
  submit(verificationId, verificationBodyJwt);
}
