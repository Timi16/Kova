"use client";

import { useEffect, useMemo } from "react";
import { useActiveWallet, usePrivy, useWallets } from "@privy-io/react-auth";
import { injectiveTestnet } from "@/lib/chains";

function parseWalletChainId(chainId?: string) {
  if (!chainId) return null;
  if (chainId.startsWith("eip155:")) {
    const parsed = Number.parseInt(chainId.slice("eip155:".length), 10);
    return Number.isFinite(parsed) ? parsed : null;
  }
  if (chainId.startsWith("0x")) {
    const parsed = Number.parseInt(chainId, 16);
    return Number.isFinite(parsed) ? parsed : null;
  }
  const parsed = Number.parseInt(chainId, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

export function useAuth() {
  const { ready, authenticated, user, login, logout } = usePrivy();
  const { wallets } = useWallets();
  const { wallet: activeWallet, setActiveWallet } = useActiveWallet();

  const preferredWallet = useMemo(() => {
    const walletOnInjective = wallets.find(
      (wallet) => parseWalletChainId(wallet.chainId) === injectiveTestnet.id,
    );

    if (walletOnInjective) {
      return walletOnInjective;
    }

    const embeddedWallet = wallets.find((wallet) => wallet.walletClientType === "privy");
    return embeddedWallet ?? wallets[0];
  }, [wallets]);

  useEffect(() => {
    if (!preferredWallet || activeWallet?.address === preferredWallet.address) {
      return;
    }

    setActiveWallet(preferredWallet);
  }, [activeWallet?.address, preferredWallet, setActiveWallet]);

  const selectedWallet = preferredWallet ?? activeWallet;
  const address = selectedWallet?.address;

  return {
    isReady: ready,
    isAuthenticated: authenticated,
    user,
    wallet: selectedWallet,
    address,
    login,
    logout,
    isLoading: !ready,
  };
}
