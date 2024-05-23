// Copyright 2024 Circle Internet Financial, LTD.  All rights reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
//
// SPDX-License-Identifier: Apache-2.0

use anchor_lang::prelude::*;

use solana_program::{
    keccak,
    secp256k1_recover::{secp256k1_recover, Secp256k1Pubkey},
};

declare_id!("HGzMrtmwPrgSLy9Y9YM9JC1QXSwpJyMVEivm62yqfzcZ");

#[derive(AnchorSerialize, AnchorDeserialize, Debug)]
pub struct VerificationResult {
    name: String,
    version: String,
    cluster: String,
    subject: Pubkey,
    expiration: i64,
    schema: String,
}

#[program]
pub mod verity {
    use super::*;
    pub fn initialize(
        ctx: Context<Initialize>,
        signature: [u8; 64],
        recovery_id: u8,
        verification_result: VerificationResult,
    ) -> ProgramResult {
        msg!("Recover id: {}", recovery_id);

        // Require the domain separator name
        require!(
            verification_result.name == "VerificationRegistry",
            ErrorCode::InvalidName
        );

        // Require the domain separator version
        require!(
            verification_result.version == "1.0",
            ErrorCode::InvalidVersion
        );

        // Require the domain separator cluster be "localnet".
        // This value is hardcoded and should be changed before deploying to a
        // different cluster. This will ensure a Verification Result intended
        // for localnet, or for testing, cannot be elevated to a production
        // environment. You can find more details in the README.
        // https://github.com/circlefin/verity-verifier/tree/master/packages/solana#domain-separator
        require!(
            verification_result.cluster == "localnet",
            ErrorCode::InvalidCluster
        );
        // Require that the subject account is the subject
        require!(
            ctx.accounts.subject.key() == verification_result.subject,
            ErrorCode::SubjectMismatch
        );

        // Require that the subject account signs the transaction
        require!(
            ctx.accounts.subject.is_signer,
            ErrorCode::SubjectIsNotSigner
        );

        // Require that the message is not expired
        require!(
            ctx.accounts.clock.unix_timestamp < verification_result.expiration,
            ErrorCode::Expired
        );

        // Require that the schema is KYC
        require!(
            verification_result.schema == "centre.io/credentials/kyc",
            ErrorCode::InvalidSchema
        );

        // Recover the address that signed the signature
        let mut message = Vec::new();
        verification_result.serialize(&mut message).unwrap();
        let hash = keccak::hash(message.as_ref());
        let result = secp256k1_recover(hash.as_ref(), recovery_id, signature.as_ref());

        // Hardcode a verifier.
        let pubkey = Secp256k1Pubkey([
            131, 24, 83, 91, 84, 16, 93, 74, 122, 174, 96, 192, 143, 196, 95, 150, 135, 24, 27, 79,
            223, 198, 37, 189, 26, 117, 63, 167, 57, 127, 237, 117, 53, 71, 241, 28, 168, 105, 102,
            70, 242, 243, 172, 176, 142, 49, 1, 106, 250, 194, 62, 99, 12, 93, 17, 245, 159, 97,
            254, 245, 123, 13, 42, 165,
        ]);
        // Require the recovered public key is the verifer
        let result2 = result.unwrap();
        require!(result2 == pubkey, ErrorCode::Invalid);
        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(signature: [u8; 64], recovery_id: u8, verification_result: VerificationResult)]
pub struct Initialize<'info> {
    pub subject: Signer<'info>,
    pub clock: Sysvar<'info, Clock>,
}

#[error]
pub enum ErrorCode {
    NotOk,
    Invalid,
    SubjectMismatch,
    SubjectIsNotSigner,
    Expired,
    InvalidSchema,
    InvalidName,
    InvalidVersion,
    InvalidCluster,
}
