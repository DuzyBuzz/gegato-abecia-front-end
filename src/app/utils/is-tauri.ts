// src/app/utils/is-tauri.ts
export function isTauri(): boolean {
  return '__TAURI__' in window;
}
