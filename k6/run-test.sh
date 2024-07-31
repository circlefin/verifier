#!/usr/bin/env sh
# Copyright 2024 Circle Internet Group, Inc.  All rights reserved.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
#
# SPDX-License-Identifier: Apache-2.0


if [ -z "$TEST" ]; then
    echo "\$TEST is empty. \$TEST should contain path to test file. E.g: \"make run TEST=dist/wallet_resource.create_wallet.test.bundle.js\""
    exit 1
fi

export K6_COMPATIBILITY_MODE=base
echo "Executing $TEST"
${GOPATH:-~/go}/bin/k6 run $K6_OPTS --insecure-skip-tls-verify "$TEST"
