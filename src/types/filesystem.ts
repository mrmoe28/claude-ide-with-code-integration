// File System Access API TypeScript declarations
// These are not fully available in all TypeScript versions

declare global {
  interface Window {
    showDirectoryPicker(options?: {
      mode?: 'read' | 'readwrite'
      startIn?: FileSystemHandle | string
    }): Promise<FileSystemDirectoryHandle>
    
    showOpenFilePicker(options?: {
      multiple?: boolean
      excludeAcceptAllOption?: boolean
      types?: Array<{
        description?: string
        accept: Record<string, string[]>
      }>
    }): Promise<FileSystemFileHandle[]>
  }

  interface FileSystemHandle {
    readonly kind: 'file' | 'directory'
    readonly name: string
    
    isSameEntry(other: FileSystemHandle): Promise<boolean>
  }

  interface FileSystemFileHandle extends FileSystemHandle {
    readonly kind: 'file'
    
    getFile(): Promise<File>
    createWritable(options?: FileSystemCreateWritableOptions): Promise<FileSystemWritableFileStream>
  }

  interface FileSystemDirectoryHandle extends FileSystemHandle {
    readonly kind: 'directory'
    
    entries(): AsyncIterableIterator<[string, FileSystemHandle]>
    keys(): AsyncIterableIterator<string>
    values(): AsyncIterableIterator<FileSystemHandle>
    
    getFileHandle(name: string, options?: { create?: boolean }): Promise<FileSystemFileHandle>
    getDirectoryHandle(name: string, options?: { create?: boolean }): Promise<FileSystemDirectoryHandle>
    
    removeEntry(name: string, options?: { recursive?: boolean }): Promise<void>
    resolve(possibleDescendant: FileSystemHandle): Promise<string[] | null>
  }

  interface FileSystemCreateWritableOptions {
    keepExistingData?: boolean
  }

  interface FileSystemWritableFileStream extends WritableStream {
    write(data: BufferSource | Blob | string): Promise<void>
    seek(position: number): Promise<void>
    truncate(size: number): Promise<void>
  }
}

export {}