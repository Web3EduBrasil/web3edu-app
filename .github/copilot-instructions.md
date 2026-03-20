# Copilot Instructions — Web3EduBrasil

## Stack & Versões

- **Next.js 14** (App Router, Node.js 20) — sem Pages Router
- **React 18** com TypeScript `~5.4.x`
- **Tailwind CSS v3** + **DaisyUI v4** para estilos
- **Firebase 11** (Client SDK) + **Firebase Admin SDK 13** para server-side
- **wagmi v2** + **RainbowKit v2** + **viem v2** para Web3 (rede: Sepolia)
- **next-intl v3** para internacionalização (locales: `pt`, `en`)
- **Framer Motion v11**, **Lottie React**, **React Toastify**
- **Font**: Lexend Deca (Google Fonts, via `next/font`)

---

## Arquitetura

```
src/
  app/              → Next.js App Router (layouts, pages, API routes)
  components/       → Componentes de UI agrupados por página/feature
  interfaces/       → Todas as interfaces TypeScript (interfaces.ts)
  lib/              → Helpers e providers (auth, wagmi, web3auth, xp, loading)
  providers/        → React Contexts (content-context, loading-context)
  firebase/         → Firebase Client SDK config (apenas client-side)
  styles/           → globals.css
  contents/         → Conteúdo MDX das trilhas
public/
  locales/          → Arquivos de tradução JSON (pt/, en/)
  assets/           → Ícones, imagens, animações Lottie
functions/          → Firebase Cloud Functions (Node.js 22, TypeScript)
```

---

## Regras Firebase — CRÍTICO

### Client SDK (`src/firebase/config.ts`)
- Exporta: `app`, `auth`, `storage`, `db`, `model`
- **Usar APENAS em componentes client-side** (`"use client"`)
- **NUNCA usar em API routes** (`src/app/api/`) — causa falhas server-side

### Admin SDK (`src/lib/firebase-admin.ts`)
- Exporta: `adminDb`, `adminAuth`
- **SEMPRE usar em API routes e server-side code**
- Sintaxe diferente do Client SDK:

| Client SDK | Admin SDK |
|---|---|
| `doc(db, "col", id)` | `adminDb.collection("col").doc(id)` |
| `await getDoc(ref)` | `await ref.get()` |
| `await getDocs(col)` | `await col.get()` |
| `docSnap.exists()` | `docSnap.exists` ← propriedade, sem `()` |
| `await updateDoc(ref, data)` | `await ref.update(data)` |
| `await setDoc(ref, data)` | `await ref.set(data)` |
| `arrayUnion(val)` | Spread manual: `[...arr, val]` |
| `collection(ref, "sub")` | `adminDb.collection("col/id/sub")` |
| `query(col, where(...))` | `adminDb.collection("col").where(...)` |

### Exceção
- `/api/ai/route.ts` usa `model` do Client SDK (Vertex AI) — não migrar para Admin.

---

## API Routes

- Ficam em `src/app/api/[recurso]/route.ts`
- Importar `adminDb` de `@/lib/firebase-admin`
- Autenticação: usar `verifyAuth(req)` de `@/lib/auth-helper` — retorna o UID ou lança erro
- Padrão de autenticação nas rotas que exigem login:

```ts
import { verifyAuth } from "@/lib/auth-helper";

export const POST = async (req: NextRequest) => {
  let verifiedUid: string;
  try { verifiedUid = await verifyAuth(req); }
  catch { return NextResponse.json({ message: "Não autorizado" }, { status: 401 }); }
  // ...
};
```

- Retornar sempre `NextResponse.json(...)` em vez de `new NextResponse(JSON.stringify(...), { status })`
- Marcar rotas dinâmicas com `export const dynamic = "force-dynamic";`

---

## Autenticação & Web3

- Firebase Auth para Google login (`signInWithPopup`)
- Carteiras Web3: wagmi v2 + RainbowKit v2 (conectores: injected, MetaMask, Coinbase)
- Rede: **Sepolia** (testnet Ethereum)
- RPC via Alchemy (`NEXT_PUBLIC_ALCHEMY_RPC_TARGET`)
- O UID do usuário com carteira é o endereço Ethereum (começa com `0x`)
- Toda a lógica de autenticação está em `src/lib/web3auth/web3auth.tsx`
- Provider de autenticação: `Web3AuthProvider`

---

## Internacionalização (i18n)

- Provider: `next-intl`
- Locales suportados: `pt` (padrão), `en`
- Arquivos em `public/locales/{locale}/[namespace].json`
  - Namespaces: `common`, `home`, `landing`, `onboarding`, `userpage`
- Ao adicionar uma nova chave de tradução, **sempre adicionar em todos os locales** (`pt` e `en`)
- Hook: `const t = useTranslations("namespace.section")`

---

## Estilos & UI

- Tailwind CSS + DaisyUI — preferir classes utilitárias
- Dark/Light mode via atributo `data-theme` no `<html>` (`"dark"` ou `"light"`)
- Cores customizadas definidas no `tailwind.config.ts`:
  - `cgray` — card background
  - `cdark`, `cblue`, `cprimary`, etc.
- Fonte global: **Lexend Deca** (aplicada no `layout.tsx`)
- Animações: Framer Motion para transições de UI; Lottie para animações JSON
- Toasts: `react-toastify` com `<ToastContainer>` no layout

---

## Tipagem

- Todas as interfaces centralizadas em `src/interfaces/interfaces.ts`
- Adicionar novas interfaces nesse arquivo, não criar interfaces inline em componentes
- Sempre importar interfaces: `import { MinhaInterface } from "@/interfaces/interfaces"`

---

## Gamificação (XP & Níveis)

- Lógica em `src/lib/xp.ts`:
  - 100 XP por nível
  - `levelFromXp(xp)` → nível atual
  - `XP_REWARDS`: `SECTION_COMPLETE = 10`, `TRAIL_COMPLETE = 50`, `PROGRAM_COMPLETE = 100`
- XP é atualizado no Firestore campo `xp` e `level` do documento do usuário em `users/{uid}`

---

## Estrutura do Firestore

| Coleção | Descrição |
|---|---|
| `users/{uid}` | Perfil do usuário (displayName, xp, level, trails[], socialMedia) |
| `trails/{trailId}` | Metadados de uma trilha |
| `trails/{trailId}/contents/{sectionId}` | Seções/conteúdos de uma trilha |
| `whitelist/{uid}` | Elegibilidade para NFT de trilha |
| `programWhitelist/{uid}` | Elegibilidade para NFT de programa |
| `programs/{programId}` | Programas educacionais |
| `programsWL/{programId}` | Fila de solicitação para programas |
| `leaderboard` | Ranking de usuários |

---

## Cloud Functions (`functions/`)

- Runtime: Node.js 22, TypeScript
- Entry point: `functions/src/index.ts`
- Triggers em `functions/src/trigger/`
- Utilitários em `functions/src/utils/`
- Deploy: `firebase deploy --only functions`

---

## Deploy

- **CI/CD automático**: push na branch `main` dispara o workflow `.github/workflows/firebase-deploy.yml`
- **Deploy manual**: `npm run build` → `firebase deploy --only hosting`
- Projeto Firebase: `web3edubrasil`
- Todos os env vars sensíveis ficam nos Secrets do GitHub; localmente no `.env`

---

## Comandos Principais

```powershell
npm run dev          # Servidor de desenvolvimento
npm run build        # Build de produção
npm run lint         # ESLint
firebase deploy --only hosting    # Deploy manual
firebase deploy --only functions  # Deploy das Cloud Functions
```

> **Atenção Windows**: `npm run dev` e `npm run build` conflitam na pasta `.next`.
> Pare o `dev` antes de rodar o `build`.

---

## Convenções de Código

1. Componentes client-side começam com `"use client"` na primeira linha
2. Páginas do App Router são `default export`; componentes são `named export`
3. Imports com alias `@/` sempre que fora do diretório raiz do módulo
4. Sem `console.log` em produção — usar `console.error` apenas em catch de API routes
5. Não usar `new NextResponse(JSON.stringify(...))` — usar `NextResponse.json(...)`
6. TypeScript `~5.4.x` — não atualizar para `5.5+` até o `eslint-config-next` suportar
