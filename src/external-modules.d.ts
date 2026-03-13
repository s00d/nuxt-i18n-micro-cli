declare module 'lilt-node'
declare module 'reverso-api'
declare module 'papago'
declare module 'dlv' {
  export default function dlv<T = unknown>(obj: unknown, key: string | Array<string | number>, fallback?: T): T | undefined
}
