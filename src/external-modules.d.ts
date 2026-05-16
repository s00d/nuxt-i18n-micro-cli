declare module 'archiver' {
  import type stream from 'node:stream'
  import type { ZlibOptions } from 'node:zlib'

  export interface ZipOptions {
    zlib?: ZlibOptions
    comment?: string
    store?: boolean
  }

  export interface EntryData {
    name: string
  }

  export class ZipArchive extends stream.Transform {
    constructor(options?: ZipOptions)
    append(source: stream.Readable | Buffer | string, data?: EntryData): this
    directory(dirpath: string, destpath: false | string): this
    pipe<T extends NodeJS.WritableStream>(destination: T): T
    finalize(): Promise<void>
    on(event: 'error', listener: (error: Error) => void): this
    on(event: 'close' | 'finish', listener: () => void): this
    on(event: string, listener: (...args: unknown[]) => void): this
  }
}

declare module 'dlv' {
  export default function dlv<T = unknown>(obj: unknown, key: string | Array<string | number>, fallback?: T): T | undefined
}
