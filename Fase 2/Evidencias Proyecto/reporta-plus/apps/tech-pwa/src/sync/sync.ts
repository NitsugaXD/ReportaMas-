import { db } from './db'
import api from '../api/client'
import { ulid } from 'ulid'

let running = false

async function uploadFileForService(serviceId: string, localFile: any) {
  const form = new FormData()
  form.append('file', localFile.blob, localFile.name)
  form.append('kind', 'PHOTO')
  const { data } = await api.post(`/services/${serviceId}/files`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data
}

async function processCreateAction(entry: any) {
  const { payload } = entry
  const { tempId } = payload
  // create service on backend
  const { data: created } = await api.post('/services', payload)
  const serviceId = created.id

  // upload local files tied to tempId
  const files = await db.files.where({ serviceTempId: tempId }).toArray()
  for (const f of files) {
    try {
      const res = await uploadFileForService(serviceId, f)
      await db.files.update(f.id!, { uploadedUrl: res.url })
    } catch (err) {
      throw err
    }
  }

  if (payload.finishAfterCreate) {
    await api.patch(`/services/${serviceId}/sign-and-send`, { notes: payload.notes || '' })
  }

  return created
}

async function processUploadAction(entry: any) {
  const { payload } = entry
  const localFile = await db.files.get(payload.localFileId)
  if (!localFile) throw new Error('local file missing')
  await uploadFileForService(payload.serviceId, localFile)
  await db.files.update(localFile.id!, { uploadedUrl: 'uploaded' })
}

async function processFinishAction(entry: any) {
  const { payload } = entry
  await api.patch(`/services/${payload.serviceId}/sign-and-send`, { notes: payload.notes })
}

export async function processOutboxOnce() {
  if (running) return
  running = true
  try {
    const items = await db.outbox.orderBy('id').toArray()
    for (const it of items) {
      try {
        if (it.type === 'createService') {
          await processCreateAction(it)
        } else if (it.type === 'uploadFile') {
          await processUploadAction(it)
        } else if (it.type === 'finishService') {
          await processFinishAction(it)
        } else if (it.type === 'updateService') {
          await api.patch(`/services/${it.payload.id}`, it.payload.changes)
        }
        await db.outbox.delete(it.id!)
      } catch (err) {
        const attempts = (it.attempts || 0) + 1
        await db.outbox.update(it.id!, { attempts })
        if (attempts > 5) {
          console.warn('Action failed repeatedly, skipping:', it, err)
        } else {
          break
        }
      }
    }
  } finally {
    running = false
  }
}

export async function runSync() {
  if (!navigator.onLine) return
  try {
    await processOutboxOnce()
  } catch (err) {
    console.error('runSync error', err)
  }
}

export function makeTempId() {
  return ulid()
}