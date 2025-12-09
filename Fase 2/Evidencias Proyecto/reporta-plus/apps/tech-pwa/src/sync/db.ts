import Dexie from 'dexie'

export interface LocalService {
  id?: string
  tempId?: string
  payload: any
  createdAt: string
  synced?: boolean
}

export interface LocalFile {
  id?: string
  serviceTempId?: string | null
  name: string
  type: string
  blob: Blob
  uploadedUrl?: string | null
  createdAt: string
}

export interface OutboxEntry {
  id?: number
  type: 'createService' | 'uploadFile' | 'finishService' | 'updateService'
  payload: any
  createdAt: string
  attempts?: number
}

export class OfflineDB extends Dexie {
  services!: Dexie.Table<LocalService, string>
  files!: Dexie.Table<LocalFile, string>
  outbox!: Dexie.Table<OutboxEntry, number>

  constructor() {
    super('reporta_offline')
    this.version(1).stores({
      services: '++id, tempId, createdAt, synced',
      files: '++id, serviceTempId, createdAt',
      outbox: '++id, type, createdAt',
    })
    this.services = this.table('services')
    this.files = this.table('files')
    this.outbox = this.table('outbox')
  }
}

export const db = new OfflineDB()