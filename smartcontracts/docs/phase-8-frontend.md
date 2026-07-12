# Phase 8 — Frontend / Client Update

**Status:** 🔄 In Progress — code complete, pending `npm install`

> The frontend currently uses `viem` to interact with the EVM contract. This phase replaces those calls with `@coral-xyz/anchor` and `@solana/web3.js`.

---

## Install New Dependencies

```bash
npm install @solana/web3.js @coral-xyz/anchor @solana/spl-token
npm install @solana/wallet-adapter-react @solana/wallet-adapter-wallets @solana/wallet-adapter-react-ui
npm uninstall viem wagmi
```

---

## Environment Variables

Replace EVM keys in `.env`:

```env
# Remove these
NEXT_PUBLIC_CONTRACT_ADDRESS=0x...
NEXT_PUBLIC_RPC_URL=https://sepolia.infura.io/...

# Add these
NEXT_PUBLIC_PROGRAM_ID=YOUR_SOLANA_PROGRAM_ID
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.devnet.solana.com
```

---

## Wallet Provider Setup

Wrap your app with the Solana wallet adapter (replaces `wagmi` / RainbowKit):

```tsx
// app/providers.tsx
"use client";

import { FC, ReactNode, useMemo } from "react";
import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { PhantomWalletAdapter, SolflareWalletAdapter } from "@solana/wallet-adapter-wallets";
import "@solana/wallet-adapter-react-ui/styles.css";

export const SolanaProviders: FC<{ children: ReactNode }> = ({ children }) => {
  const wallets = useMemo(
    () => [new PhantomWalletAdapter(), new SolflareWalletAdapter()],
    []
  );

  return (
    <ConnectionProvider endpoint={process.env.NEXT_PUBLIC_SOLANA_RPC_URL!}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
};
```

---

## Program Client Helper

Create a shared hook to get the Anchor program instance:

```typescript
// lib/useProgram.ts
import { useAnchorWallet, useConnection } from "@solana/wallet-adapter-react";
import { AnchorProvider, Program, Idl } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import idl from "@/idl/web3edu_brasil_tokens.json";

const PROGRAM_ID = new PublicKey(process.env.NEXT_PUBLIC_PROGRAM_ID!);

export function useProgram() {
  const { connection } = useConnection();
  const wallet = useAnchorWallet();

  if (!wallet) return null;

  const provider = new AnchorProvider(connection, wallet, {
    commitment: "confirmed",
  });

  return new Program(idl as Idl, PROGRAM_ID, provider);
}
```

> The IDL file is generated automatically by `anchor build` at `target/idl/web3edu_brasil_tokens.json`. Copy it to `app/idl/`.

---

## Minting a Certificate

### Before (viem + EVM)

```typescript
await contract.write.safeMint([userAddress, ipfsUri, trailHashBytes32]);
```

### After (@coral-xyz/anchor + Solana)

```typescript
// hooks/useMintCertificate.ts
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey, SystemProgram, SYSVAR_RENT_PUBKEY, Keypair } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID, getAssociatedTokenAddress } from "@solana/spl-token";
import { useProgram } from "@/lib/useProgram";

const METADATA_PROGRAM_ID = new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s");

export function useMintCertificate() {
  const program = useProgram();
  const { publicKey: minterPublicKey } = useWallet();

  async function mintCertificate(
    recipientAddress: string,
    ipfsUri: string,
    trailId: string
  ) {
    if (!program || !minterPublicKey) throw new Error("Wallet not connected");

    const trailHash = Buffer.alloc(32);
    Buffer.from(trailId).copy(trailHash);

    const recipientPubkey = new PublicKey(recipientAddress);
    const mintKeypair = Keypair.generate();

    const [configPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("config")],
      program.programId
    );

    const [trailRecordPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("trail"), trailHash],
      program.programId
    );

    const [metadataPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("metadata"),
        METADATA_PROGRAM_ID.toBuffer(),
        mintKeypair.publicKey.toBuffer(),
      ],
      METADATA_PROGRAM_ID
    );

    const recipientTokenAccount = await getAssociatedTokenAddress(
      mintKeypair.publicKey,
      recipientPubkey
    );

    const tx = await program.methods
      .mintCertificate(Array.from(trailHash), ipfsUri)
      .accounts({
        config: configPda,
        trailRecord: trailRecordPda,
        mint: mintKeypair.publicKey,
        recipientTokenAccount,
        metadataAccount: metadataPda,
        recipient: recipientPubkey,
        signer: minterPublicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        metadataProgram: METADATA_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        rent: SYSVAR_RENT_PUBKEY,
      })
      .signers([mintKeypair])
      .rpc();

    return { tx, mint: mintKeypair.publicKey.toBase58() };
  }

  return { mintCertificate };
}
```

---

## Checking if a Trail Was Minted

Replaces `hasTrailMinted(trailHash)`. No instruction needed — just read the PDA off-chain:

```typescript
// lib/hasTrailMinted.ts
import { PublicKey } from "@solana/web3.js";
import { Program } from "@coral-xyz/anchor";

export async function hasTrailMinted(
  program: Program,
  trailId: string
): Promise<boolean> {
  const trailHash = Buffer.alloc(32);
  Buffer.from(trailId).copy(trailHash);

  const [trailRecordPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("trail"), trailHash],
    program.programId
  );

  try {
    await program.account.trailMintRecord.fetch(trailRecordPda);
    return true;   // account exists = trail was minted
  } catch {
    return false;  // account does not exist = not minted yet
  }
}
```

---

## Burning a Certificate

```typescript
// hooks/useBurnCertificate.ts
export function useBurnCertificate() {
  const program = useProgram();
  const { publicKey: burnerPublicKey } = useWallet();

  async function burnCertificate(trailId: string, holderAddress: string, mintAddress: string) {
    if (!program || !burnerPublicKey) throw new Error("Wallet not connected");

    const trailHash = Buffer.alloc(32);
    Buffer.from(trailId).copy(trailHash);

    const [configPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("config")],
      program.programId
    );

    const [trailRecordPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("trail"), trailHash],
      program.programId
    );

    const mintPubkey = new PublicKey(mintAddress);
    const holderPubkey = new PublicKey(holderAddress);
    const holderTokenAccount = await getAssociatedTokenAddress(mintPubkey, holderPubkey);

    const tx = await program.methods
      .burnCertificate(Array.from(trailHash))
      .accounts({
        config: configPda,
        trailRecord: trailRecordPda,
        mint: mintPubkey,
        holderTokenAccount,
        holder: holderPubkey,
        signer: burnerPublicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc();

    return { tx };
  }

  return { burnCertificate };
}
```

---

## Wallet Button (replaces ConnectButton from RainbowKit)

```tsx
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";

export function ConnectWallet() {
  return <WalletMultiButton />;
}
```

---

## Checklist

- [ ] `viem` / `wagmi` / RainbowKit removed
- [ ] `@solana/web3.js`, `@coral-xyz/anchor`, wallet adapter installed
- [ ] IDL file copied from `target/idl/` to `app/idl/`
- [ ] `SolanaProviders` wrapper added to `app/providers.tsx`
- [ ] `useProgram` hook created
- [ ] `useMintCertificate` implemented and tested
- [ ] `hasTrailMinted` implemented and tested
- [ ] `useBurnCertificate` implemented and tested
- [ ] Wallet connect button replaced with `WalletMultiButton`
- [ ] `.env` updated with Solana program ID and RPC URL

---

[Previous: Phase 7 — Deployment](./phase-7-deployment.md) | [Back to Overview](./README.md)
