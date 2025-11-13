import Dexie, { type Table } from 'dexie'

export type OutboxItem = {
  id?: number
  kind: 'CREATE_SERVICE' | 'UPLOAD_FILE'
  payload: any
  createdAt: number
}

class LocalDB extends Dexie {
  outbox!: Table<OutboxItem, number>
  constructor() {
    super('reporta_plus')
    this.version(1).stores({
      outbox: '++id, kind, createdAt',
    })
  }
}
export const db = new LocalDB()
