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
import { create } from "./verification.utils";

const testConfig = test_config.tests.verification.create;

export const options = testConfig.k6_options;

export function setup() {
  console.info("Setup done");
}

/**
 * Load test against our create verification endpoint
 */
export default function () {
  create();
}
