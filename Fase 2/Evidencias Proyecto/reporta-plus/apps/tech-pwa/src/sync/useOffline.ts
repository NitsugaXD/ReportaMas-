import { useEffect, useState } from 'react'
import { db } from './db'
import { makeTempId, runSync } from './sync'

let initialized = false
export function initOffline() {
  if (initialized) return
  window.addEventListener('online', () => runSync())
  initialized = true
}

export function useOfflineStatus() {
  const [pending, setPending] = useState(0)
  useEffect(() => {
    let mounted = true
    async function update() {
      const c = await db.outbox.count()
      if (mounted) setPending(c)
    }
    update()
    const interval = setInterval(update, 1000)
    return () => {
      mounted = false
      clearInterval(interval)
    }
  }, [])
  return { pending }
}

export async function enqueueCreateService(payload: any, files: File[] = []) {
  const tempId = makeTempId()
  await db.services.add({ tempId, payload: { ...payload, tempId }, createdAt: new Date().toISOString(), synced: false })
  for (const f of files) {
    await db.files.add({ serviceTempId: tempId, name: f.name, type: f.type, blob: f, createdAt: new Date().toISOString() })
  }
  await db.outbox.add({ type: 'createService', payload: { tempId, ...payload }, createdAt: new Date().toISOString(), attempts: 0 })
  if (navigator.onLine) await runSync()
}

export async function enqueueUploadFile(serviceId: string, file: File) {
  const localId = await db.files.add({ serviceTempId: null, name: file.name, type: file.type, blob: file, createdAt: new Date().toISOString() })
  await db.outbox.add({ type: 'uploadFile', payload: { serviceId, localFileId: localId }, createdAt: new Date().toISOString(), attempts: 0 })
  if (navigator.onLine) await runSync()
}

export async function enqueueFinishService(serviceId: string, notes?: string) {
  await db.outbox.add({ type: 'finishService', payload: { serviceId, notes }, createdAt: new Date().toISOString(), attempts: 0 })
  if (navigator.onLine) await runSync()
}