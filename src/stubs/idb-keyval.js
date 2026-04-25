// Stub server-side para idb-keyval.
// O pacote original usa indexedDB (browser-only). No servidor (SSR/Node.js)
// provemos implementações no-op para que o WalletConnect não quebre durante SSR.
// No cliente, o next.config.mjs aponta para o pacote real.

export const get = async () => undefined;
export const set = async () => { };
export const del = async () => { };
export const clear = async () => { };
export const keys = async () => [];
export const values = async () => [];
export const entries = async () => [];
export const getMany = async () => [];
export const setMany = async () => { };
export const delMany = async () => { };
export const update = async () => { };
export const promisifyRequest = () => Promise.resolve(undefined);
export const createStore = () => () => Promise.resolve(undefined);
