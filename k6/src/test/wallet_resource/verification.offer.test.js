/*
 * Copyright (c) 2022, Circle Internet Financial Trading Company Limited.
 * All rights reserved.
 *
 * Circle Internet Financial Trading Company Limited CONFIDENTIAL
 *
 * This file includes unpublished proprietary source code of Circle Internet
 * Financial Trading Company Limited, Inc. The copyright notice above does not
 * evidence any actual or intended publication of such source code. Disclosure
 * of this source code or any related proprietary information is strictly
 * prohibited without the express written permission of Circle Internet Financial
 * Trading Company Limited.
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
