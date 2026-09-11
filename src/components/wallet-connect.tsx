"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * Intentional wallet connect for Screenpad.
 *
 * Detects Phantom (and other window.wallet providers). If none is installed,
 * the button explains exactly that instead of pretending to connect. On
 * success it displays the connected address — read-only, no signing requests,
 * no hidden approvals. Disconnect clears state locally.
 */

type WalletStatus =
  | { state: "disconnected" }
  | { state: "connecting" }
  | { state: "connected"; address: string }
  | { state: "unavailable" };

type PhantomProvider = {
  connect: (opts?: { onlyIfTrusted?: boolean }) => Promise<{ publicKey: { toString(): string } }>;
  disconnect: () => Promise<void>;
};

function getPhantom(): PhantomProvider | null {
  if (typeof window === "undefined") return null;
  const wallet = (window as unknown as { phantom?: { solana?: PhantomProvider } }).phantom;
  return wallet?.solana ?? null;
}

export function WalletConnect() {
  const [status, setStatus] = useState<WalletStatus>({ state: "disconnected" });

  useEffect(() => {
    // Silent reconnect only if the user previously authorized this site.
    const phantom = getPhantom();
    if (!phantom) return;

    phantom
      .connect({ onlyIfTrusted: true })
      .then((response) => {
        setStatus({ state: "connected", address: response.publicKey.toString() });
      })
      .catch(() => {
        // Not previously trusted — stay disconnected. Never auto-prompt.
      });
  }, []);

  const connect = useCallback(async () => {
    const phantom = getPhantom();

    if (!phantom) {
      setStatus({ state: "unavailable" });
      return;
    }

    setStatus({ state: "connecting" });
    try {
      const response = await phantom.connect();
      setStatus({ state: "connected", address: response.publicKey.toString() });
    } catch {
      // User rejected or popup closed.
      setStatus({ state: "disconnected" });
    }
  }, []);

  const disconnect = useCallback(async () => {
    const phantom = getPhantom();
    if (phantom) {
      await phantom.disconnect().catch(() => {});
    }
    setStatus({ state: "disconnected" });
  }, []);

  const short = (address: string) => `${address.slice(0, 4)}…${address.slice(-4)}`;

  if (status.state === "connected") {
    return (
      <button
        type="button"
        onClick={disconnect}
        title={status.address}
        className="w-full border-2 border-up bg-panel px-2 py-2 font-crt text-base leading-none text-up hover:bg-panel-2"
      >
        ● {short(status.address)}
      </button>
    );
  }

  if (status.state === "unavailable") {
    return (
      <a
        href="https://phantom.app/download"
        target="_blank"
        rel="noreferrer"
        className="block w-full border-2 border-line bg-panel px-2 py-2 text-center font-crt text-base leading-none text-muted hover:border-ink hover:text-ink"
      >
        INSTALL PHANTOM
      </a>
    );
  }

  return (
    <button
      type="button"
      onClick={connect}
      disabled={status.state === "connecting"}
      className="w-full border-2 border-line bg-panel px-2 py-2 font-crt text-base leading-none text-muted hover:border-ink hover:text-ink disabled:opacity-60"
    >
      {status.state === "connecting" ? "CONNECTING…" : "△ CONNECT WALLET"}
    </button>
  );
}
