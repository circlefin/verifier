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
import { create, offer } from "./verification.utils";
import { rand } from "loadtest-common/common";

const testConfig = test_config.tests.verification.offer;

export const options = testConfig.k6_options;

export function setup() {
  console.info("Running setup..");
  console.info(
    `Creating ${testConfig.challenge_token_url_count} verifiable credentials.`
  );
  const challengeTokenUrls = [];
  for (let i = 0; i < testConfig.challenge_token_url_count; i++) {
    const challengeTokenUrl = create();
    console.info(`challengeTokenUrl generated #${i}:\n${challengeTokenUrl}\n`);
    challengeTokenUrls.push(challengeTokenUrl);
  }
  console.info("Setup done");
  return challengeTokenUrls;
}

/**
 * Load test against our verification offer endpoint
 */
export default function (challengeTokenUrls) {
  const random = rand(challengeTokenUrls);
  offer(random);
}
