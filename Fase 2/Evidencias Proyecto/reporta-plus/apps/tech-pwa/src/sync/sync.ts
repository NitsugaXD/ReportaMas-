import api from '../api/client'
import { db } from '../db/dexie'

export async function runSync() {
  const items = await db.outbox.orderBy('createdAt').toArray()
  for (const it of items) {
    try {
      if (it.kind === 'CREATE_SERVICE') {
        const { data } = await api.post('/services', it.payload)
        // si el payload tenía archivos pendientes, podrías encolar UPLOAD_FILE con el nuevo id
      }
      if (it.kind === 'UPLOAD_FILE') {
        const { serviceId, file, kind } = it.payload
        const fd = new FormData()
        fd.append('file', file as Blob)
        await api.post(`/services/${serviceId}/files?kind=${kind}`, fd, { headers:{'Content-Type':'multipart/form-data'} })
      }
      await db.outbox.delete(it.id!)
    } catch (e) {
      // si falla, paramos (se reintentará cuando vuelva la red o en el próximo tick)
      break
    }
  }
}