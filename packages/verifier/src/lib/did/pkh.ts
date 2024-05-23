/*
 * Copyright (c) 2022, Circle Internet Financial Trading Company Limited.
 * All rights reserved.
 *
 * Circle Internet Financial Trading Company Limited CONFIDENTIAL
 * This file includes unpublished proprietary source code of Circle Internet
 * Financial Trading Company Limited, Inc. The copyright notice above does not
 * evidence any actual or intended publication of such source code. Disclosure
 * of this source code or any related proprietary information is strictly
 * prohibited without the express written permission of Circle Internet Financial
 * Trading Company Limited.
 */

import pkhDidResolver from "pkh-did-resolver"

/**
 * A did:pkh resolver that adheres to the `did-resolver` API.
 *
 * This resolver is used to verify the signature of a did:pkh.
 *
 * Reference:
 * https://github.com/ceramicnetwork/js-ceramic/tree/develop/packages/pkh-did-resolver
 * https://github.com/w3c-ccg/did-pkh/blob/main/did-pkh-method-draft.md
 */

export const pkhResolver = pkhDidResolver.getResolver()
