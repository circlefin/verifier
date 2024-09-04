"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useWalletModal = exports.WalletModalContext = void 0;
const react_1 = require("react");
exports.WalletModalContext = (0, react_1.createContext)({});
function useWalletModal() {
    return (0, react_1.useContext)(exports.WalletModalContext);
}
exports.useWalletModal = useWalletModal;
//# sourceMappingURL=useWalletModal.js.map