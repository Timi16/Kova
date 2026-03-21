"use client";

import { usePrivy, useWallets } from "@privy-io/react-auth";

export function useAuth() {
  const { ready, authenticated, user, login, logout } = usePrivy();
  const { wallets } = useWallets();

  const activeWallet =
    wallets.find((wallet) => wallet.walletClientType !== "privy") ?? wallets[0];

  const address = activeWallet?.address;

  return {
    isReady: ready,
    isAuthenticated: authenticated,
    user,
    wallet: activeWallet,
    address,
    login,
    logout,
    isLoading: !ready,
  };
}
