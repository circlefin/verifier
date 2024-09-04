import { createContext, useContext } from 'react';
export const WalletModalContext = createContext({});
export function useWalletModal() {
    return useContext(WalletModalContext);
}
//# sourceMappingURL=useWalletModal.js.map