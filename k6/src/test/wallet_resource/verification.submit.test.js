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
import { rand } from "loadtest-common/common";
import {
  create,
  generateSubmitBody,
  getCredential,
  offer,
  submit,
} from "./verification.utils";

const testConfig = test_config.tests.verification.submit;

export const options = testConfig.k6_options;

export function setup() {
  console.info("Running setup..");
  console.info(`Creating ${testConfig.verifiable_credential_count} requests.`);
  const requestPayloads = [];
  for (let i = 0; i < testConfig.verifiable_credential_count; i++) {
    const credential = getCredential();
    console.info(`Credential generated #${i}:\n${credential}\n`);
    const challengeTokenUrl = create();
    const { verificationId, challenge } = offer(challengeTokenUrl);
    const verificationBodyJwt = generateSubmitBody(
      credential,
      verificationId,
      challenge
    );
    requestPayloads.push({ verificationId, verificationBodyJwt });
  }
  console.info("Setup done");
  return requestPayloads;
}

/**
 * Load test against our post verification endpoint
 */
export default function (requestPayloads) {
  const { verificationId, verificationBodyJwt } = rand(requestPayloads);
  submit(verificationId, verificationBodyJwt);
}
