/// <reference types="astro/client" />

declare module 'node:fs' {
  export function readFileSync(path: string | URL, encoding: 'utf8'): string;
  export function readFileSync(path: string | URL): Uint8Array;
}

declare module 'node:zlib' {
  export function gunzipSync(data: Uint8Array): { toString(encoding: 'utf8'): string };
}

declare module 'node:path' {
  export function resolve(...paths: string[]): string;
}

declare const process: {
  cwd(): string;
};
