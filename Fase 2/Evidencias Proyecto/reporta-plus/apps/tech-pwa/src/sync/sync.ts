import api from '../api/client'
import { db, type OutboxItem } from '../db/dexie'

type FileKind = 'PHOTO' | 'SIGNATURE' | 'PDF' | 'XLSX'

type PendingFiles = {
  photos: File[]
  attachments: { file: File; kind: FileKind }[]
  signature?: File | null
}

export async function runSync() {
  const items = await db.outbox.orderBy('createdAt').toArray()
  for (const it of items) {
    try {
      if (it.kind === 'CREATE_SERVICE') {
        await processCreateService(it)
      }
      if (it.kind === 'UPLOAD_FILE') {
        await processUploadFile(it)
      }
      await db.outbox.delete(it.id!)
    } catch (e) {
      break
    }
  }
}

async function processCreateService(it: OutboxItem) {
  const payload = it.payload
  const dto = payload.dto ?? payload
  const files: PendingFiles | undefined = payload.files

  const { data: svc } = await api.post('/services', dto)

  if (!files) return

  const uploads: Promise<any>[] = []

  for (const photo of files.photos ?? []) {
    const fd = new FormData()
    fd.append('file', photo)
    uploads.push(
      api.post(`/services/${svc.id}/files?kind=PHOTO`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      }),
    )
  }

  for (const att of files.attachments ?? []) {
    const fd = new FormData()
    fd.append('file', att.file)
    uploads.push(
      api.post(`/services/${svc.id}/files?kind=${att.kind}`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      }),
    )
  }

  if (files.signature) {
    const fd = new FormData()
    fd.append('file', files.signature)
    uploads.push(
      api.post(`/services/${svc.id}/files?kind=SIGNATURE`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      }),
    )
  }

  if (uploads.length) {
    await Promise.all(uploads)
  }
}

async function processUploadFile(it: OutboxItem) {
  const { serviceId, file, kind } = it.payload as {
    serviceId: string
    file: File
    kind: FileKind
  }
  const fd = new FormData()
  fd.append('file', file as Blob)
  await api.post(`/services/${serviceId}/files?kind=${kind}`, fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}