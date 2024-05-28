pragma solidity ^0.8.0;

import "./VerificationRegistry.sol";

/**
 * A dummy contract used for testing purposes
 */
contract TestRegistry is VerificationRegistry {

    function validate(
        VerificationResult memory verificationResult,
        bytes memory signature
    ) external view returns (VerificationRecord memory) {
        return _validateVerificationResult(verificationResult, signature);
    }

}
