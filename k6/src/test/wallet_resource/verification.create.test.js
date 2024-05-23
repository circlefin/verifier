/*
 * Copyright 2024 Circle Internet Group, Inc.  All rights reserved.
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
