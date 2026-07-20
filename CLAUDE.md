# Web3EduBrasil App — CLAUDE.md

## Visão Geral

MVP de plataforma de ensino Web3 voltada ao mercado brasileiro. O aluno aprende sobre blockchain/Web3, completa trilhas e programas, e recebe **certificados NFT mintados na rede Solana**. Autenticação híbrida: Google, e-mail/senha ou carteira Solana (Phantom/Solflare).

> **Decisão de stack:** o projeto começou em Ethereum, migrou para Solana. Vestígios de EVM ainda existem no código e devem ser removidos progressivamente — veja seção "Dívida Ethereum/EVM" abaixo.

---

## Tech Stack

| Camada | Tecnologia |
|---|---|
| Framework | Next.js 14 App Router + TypeScript |
| Estilo | Tailwind CSS + DaisyUI (light/dark via `data-theme`) |
| Animações | Framer Motion |
| i18n | next-intl (`src/i18n/`, `messages/`) |
| Auth | Firebase Auth (Google, e-mail, custom token Solana) |
| Banco | Firestore via Firebase Admin SDK |
| Blockchain | Solana — `@coral-xyz/anchor` + `@solana/web3.js` + `@solana/spl-token` |
| Carteiras | `@solana/wallet-adapter` (Phantom + Solflare) |
| IPFS | Pinata (`/api/ipfs`, `/api/ipfs/image`) |
| Conteúdo | MDX (`next-mdx-remote`, `@next/mdx`) |
| IA | Google Generative AI (`/api/ai`) |
| Testes | Vitest (`npm test`) |

---

## Mapa do Projeto

```
src/
├── app/
│   ├── page.tsx                   # Landing page
│   ├── layout.tsx                 # Root layout — SolanaProviders > Web3AuthProvider > ContentProvider
│   ├── homePage/                  # Dashboard pós-login
│   ├── trailsPage/                # Catálogo de trilhas
│   ├── learn/[trailIdRt]/         # Leitor de trilha + seções MDX
│   ├── programsPage/              # Catálogo de programas
│   ├── programPage/[id]/          # Detalhe de programa
│   ├── userPage/                  # Perfil do usuário
│   ├── onboarding/                # KYC + onboarding
│   ├── certificates/[ipfsHash]/   # Página pública do certificado NFT
│   └── api/
│       ├── auth/solana/           # POST: verifica assinatura Solana → Firebase custom token
│       ├── whitelist/             # GET/POST: mint certificado de TRILHA na Solana
│       ├── programWhitelist/      # GET/POST: status certificado de PROGRAMA (⚠️ POST não minta ainda)
│       ├── ipfs/                  # POST: upload JSON de metadata no Pinata
│       ├── ipfs/image/            # POST: upload de imagem no Pinata
│       ├── trail/                 # GET: dados da trilha
│       ├── trail/contents/        # GET: seções da trilha
│       ├── trail/contents/section/# GET: conteúdo MDX de uma seção
│       ├── trails/                # GET: lista de trilhas do usuário
│       ├── programs/              # GET: lista de programas
│       ├── program/               # GET: dados de um programa
│       ├── programsWL/            # GET: whitelist de programas
│       ├── user/                  # GET/POST: perfil do usuário
│       ├── user/edit/             # PUT: atualizar perfil
│       ├── user/streak/           # POST: atualizar streak diário
│       ├── kyc/                   # POST: salvar dados KYC
│       ├── leaderboard/           # GET: ranking de alunos
│       ├── ai/                    # POST: verificação de resposta por IA
│       ├── lesson-qna/            # POST: Q&A por aula
│       ├── mdx/content/           # GET: conteúdo MDX
│       └── admin/seed-trail/      # POST: seed de trilha (admin)
│
├── components/
│   ├── landingPage/               # Seções 1-4, footer, cards de trilhas
│   ├── NavBar/                    # NavBar, UserMenu, ThemeSwitcher, LanguageSwitcher
│   ├── RewardContainer/           # Modal de mint de certificado NFT
│   ├── learn/                     # LearnContainer, TrailTopics, TaskList, BottomTabs
│   ├── Task/                      # Quiz, Question, LessonQnA, mídia (audio/video/image)
│   ├── TrailsPage/                # Cards e container de trilhas
│   ├── programsPage/              # ProgramCard, ProgramContainer
│   ├── programPage/               # Detalhe de programa
│   ├── homePage/                  # Dashboard cards (User, Leaderboard, Journeys, TrailCards)
│   ├── KYC/                       # Steps de onboarding (Intro, Kyc1, Kyc2)
│   ├── onboardingPage/            # Tutorial, WalletConfig, Comunidade
│   └── ui/                        # Button, IconButton, Input, TextArea, LoadingOverlay, etc.
│
├── lib/
│   ├── solana-mint.ts             # mintTrailCertificate() — mint server-side via Anchor
│   ├── solana/
│   │   ├── SolanaProviders.tsx    # Phantom + Solflare wallet adapter providers
│   │   └── useProgram.ts         # Hook Anchor (client-side, não usado no mint)
│   ├── web3auth/
│   │   ├── web3auth.tsx           # Hook de auth: Google, e-mail, Solana wallet
│   │   └── Web3AuthProvider.tsx   # Context provider
│   ├── wagmi/                     # ⚠️ DIRETÓRIO VAZIO — resíduo Ethereum, pode ser deletado
│   ├── firebase-admin.ts          # adminDb, adminAuth
│   ├── auth-helper.ts             # verifyAuth() — valida Firebase ID token nas rotas
│   ├── getIdToken.ts              # authHeaders() — obtém token do cliente
│   ├── trail-progress.ts          # computeTrailProgress()
│   ├── student-profile.ts         # Tipagem e helpers de perfil
│   ├── loading-context.tsx        # LoadingProvider — overlay global
│   └── xp.ts                      # Cálculo de XP
│
├── providers/
│   └── content-context.tsx        # TrailProvider + NftProvider + RewardProvider (mint flow)
│
├── idl/
│   └── web3edu_brasil_tokens.json # IDL do programa Anchor na Solana
│
├── contents/trails/               # Conteúdo MDX das trilhas (ex: IntroducaoWeb3/)
├── interfaces/interfaces.ts       # Tipos TypeScript compartilhados
├── i18n/                          # Configuração next-intl
└── stubs/idb-keyval.js            # No-op stub para SSR (WalletConnect usa indexedDB)

smartcontracts/                    # Repositório Anchor (Rust) do programa Solana
├── programs/                      # Código Rust do programa
└── tests/                         # Testes Anchor
```

---

## Fluxo de Mint de Certificado

```
1. Aluno completa 100% de uma trilha
2. RewardContainer abre (handleRewardContainer)
3. fetchAirDrop() em content-context.tsx:
   a. Pré-check: GET /api/whitelist — já mintado? erro terminal?
   b. Upload imagem → Pinata (api/ipfs/image)
   c. Upload metadata JSON → Pinata (api/ipfs)
   d. POST /api/whitelist { walletAddress, trailId, ipfsHash }
      → mintTrailCertificate() em solana-mint.ts
      → retorna txHash imediatamente após submissão
   e. Sucesso (txHash no response) → mintStep = "success"
   f. Fallback: pollMintStatus() se não tiver txHash na resposta
```

---

## Autenticação

- **Google / E-mail** → Firebase Auth padrão → `onAuthStateChanged` → `fetchUserDbData`
- **Solana Wallet** → conecta Phantom/Solflare → sign message → `POST /api/auth/solana` → Firebase custom token → `signInWithCustomToken` → igual ao fluxo Google
- Logout desconecta tanto Firebase quanto a carteira Solana

---

## Variáveis de Ambiente (`.env.local`)

```env
# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
FIREBASE_ADMIN_PRIVATE_KEY=
FIREBASE_ADMIN_CLIENT_EMAIL=

# Solana
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.devnet.solana.com
SOLANA_RPC_URL=https://api.devnet.solana.com
NEXT_PUBLIC_PROGRAM_ID=2GqcF3UeuJ7f2RtwVSTjNgojbkEuyEsGptbNR1eZUEqQ
MINTER_SECRET_KEY=[...array de bytes do keypair...]

# IPFS
PINATA_JWT=

# App
NEXT_PUBLIC_APP_LINK=https://www.web3edubrasil.online
```

---

## Comandos

```bash
npm run dev          # Inicia dev server
npm run build        # Build de produção
npm test             # Vitest (unit tests)
npm run seed         # Seed Firestore (scripts/seed-firestore.js)
npm run seed:force   # Seed com sobrescrita
```

---

## On-Chain (Solana Devnet)

| Item | Valor |
|---|---|
| Program ID | `2GqcF3UeuJ7f2RtwVSTjNgojbkEuyEsGptbNR1eZUEqQ` |
| Config PDA | `BfZNjCYsBh55MYjtbqV3dM4szCeWAcQ77EnV5ur2DLcT` |
| Minter/Admin | `FfGBBHsi3e7Q57BMHAnVchBtseb1t9ragdFHcm2VJeN6` |
| Instrução | `mintCertificate(trail_hash: [u8;32], uri: string)` |
| PDA por trail | seeds `["trail", trail_hash]` |

---

## Dívida Ethereum/EVM (Remover progressivamente)

### 1. `next.config.mjs` — transpilePackages mortos
Pacotes `@web3auth/base`, `@web3auth/modal`, `@web3auth/ethereum-provider`, `@web3auth/web3auth-wagmi-connector` estão no `transpilePackages` mas **não existem no `package.json`**. Remover sem medo.

### 2. `next.config.mjs` — `@rainbow-me/rainbowkit` em optimizePackageImports
Pacote não está instalado. Remover.

### 3. `src/lib/wagmi/` — diretório vazio
Resíduo da época Ethereum. Deletar.

### 4. `loginWithMetaMask` — no-op
Em `web3auth.tsx` e `Web3AuthProvider.tsx`. A função existe mas não faz nada. Remover da interface e do provider.

### 5. `RewardContainer.tsx` — check `uid.startsWith("0x")`
`hasWallet` verifica `googleUserInfo?.uid?.startsWith("0x")` — endereço Ethereum. Em Solana, o UID é a pubkey base58 (43–44 chars, não começa com `0x`). Esta lógica está errada para Solana e deve ser corrigida.

### 6. `/api/programWhitelist` POST — não minta
O POST de programas escreve no Firestore mas **não chama `mintTrailCertificate()`**. O certificado de programa nunca é mintado on-chain. Deve ser corrigido espelhando a lógica de `/api/whitelist`.

---

## Firestore Schema

```
users/{uid}
  - displayName, email, walletAddress, walletProvider
  - trails: [{ trailId, doneSections[] }]
  - onboardingCompleted, experienceLevel, ...

whitelist/{uid}
  - address: string (Solana pubkey)
  - status.{trailId}: { eligible, minted, txHash, terminalError, errorCode, errorMessage, ipfsHash }

programWhitelist/{uid}
  - address: string
  - status.{programId}: { eligible, minted, txHash, terminalError, errorCode, errorMessage, ipfsHash }

programs/{programId}
  - title, description, banner, estimatedTime, requirements

trails/{trailId}
  - name, description, banner, categories, estimatedTime, topics, introVideo

users/{uid}/achievedNfts/{docId}
  - walletAddress, trailId, type, ipfsHash, imageUrl, certificateName, createdAt
```

---

## Skills Disponíveis e Quando Usar

| Skill | Quando usar |
|---|---|
| `/run` | Rodar o app localmente para testar uma feature ou fix |
| `/verify` | Confirmar que uma mudança funciona de ponta a ponta no browser |
| `webapp-testing` | Testar fluxos com Playwright (mint, auth, navegação) |
| `vercel-react-best-practices` | Ao escrever ou revisar componentes React/Next.js |
| `frontend-design` | Ao criar ou redesenhar telas — decisões de tipografia, cores, layout |
| `web-design-guidelines` | Auditoria de acessibilidade e consistência visual |
| `code-review` | Revisar PRs ou diffs antes de commitar mudanças grandes |
| `static-analysis:semgrep` | Análise estática de segurança básica |
| `simplify` | Refatorar código após implementar features |
| `differential-review` | Revisar segurança de uma mudança específica |

---

## Padrões de Código

- **Sem comentários óbvios** — nomes de variáveis já comunicam a intenção
- **Português no UX** — strings de UI, toasts e mensagens de erro em pt-BR
- **Inglês no código** — nomes de funções, variáveis, tipos
- **Sem mocks nos testes** — testes devem usar o ambiente real quando possível
- **MVP first** — não adicionar abstrações antes de precisar; 3 cópias similares > abstração prematura
- Tailwind + DaisyUI para estilos; cores de marca definidas em `tailwind.config.ts`
- Framer Motion para animações de entrada (já configurado via `MotionDiv`)

---

## Auditoria de Build — Issues Conhecidos

### Críticos (quebram funcionalidade)
- [ ] `programWhitelist` POST não minta on-chain — certificados de programa nunca chegam à Solana
- [ ] `hasWallet` em `RewardContainer` verifica `uid.startsWith("0x")` — nunca true para Solana

### Médios (limpeza de stack)
- [ ] Remover transpilePackages/optimizePackageImports de pacotes EVM não instalados (`next.config.mjs`)
- [ ] Deletar `src/lib/wagmi/` (diretório vazio)
- [ ] Remover `loginWithMetaMask` de `Web3AuthProvider` e interface

### Menores (qualidade)
- [ ] Deletar `/api/programsWL` — endpoint legado Ethereum, nunca chamado pelo app. Era usado pelo Certifier admin (EVM) para pegar usuários manualmente. Substituído 100% pelo `/api/programWhitelist` (Solana). Coleção Firestore `programsWL` também pode ser descartada.
