import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ulid } from 'ulid'
import api from '../api/client'
import { db } from '../db/dexie'

export default function ServiceNew() {
  const nav = useNavigate()
  const [form, setForm] = useState({
    clientName: '',
    siteName: '',
    siteAddress: '',
    type: 'Mantención',
    notes: '',
  })
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)

  async function createOnline(dto: any) {
    const { data } = await api.post('/services', dto)
    return data
  }

  async function createOffline(dto: any) {
    await db.outbox.add({
      kind: 'CREATE_SERVICE',
      payload: dto,
      createdAt: Date.now(),
    })
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErr('')
    setLoading(true)
    try {
      const token = localStorage.getItem('access_token')
      if (!token) throw new Error('No autenticado')

      const payload = JSON.parse(atob(token.split('.')[1]))
      const dto: any = {
        serviceUid: ulid(),
        techId: payload.sub,
        type: form.type,
        notes: form.notes,
        clientName: form.clientName || undefined,
        siteName: form.siteName || undefined,
        siteAddress: form.siteAddress || undefined,
      }

      if (navigator.onLine) {
        const s = await createOnline(dto)
        nav(`/s/${s.id}`)
      } else {
        await createOffline(dto)
        alert('📡 Sin conexión: el servicio se encoló para sincronizar.')
        nav('/')
      }
    } catch (e: any) {
      setErr(e?.response?.data?.message || e?.message || 'Error inesperado')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-4 max-w-lg mx-auto">
      <h1 className="text-xl font-semibold mb-4">Nuevo servicio</h1>
      <form onSubmit={onSubmit} className="space-y-3">
        <input
          className="border rounded w-full p-2"
          placeholder="Nombre del cliente"
          value={form.clientName}
          onChange={(e) => setForm((f) => ({ ...f, clientName: e.target.value }))}
        />
        <input
          className="border rounded w-full p-2"
          placeholder="Nombre del sitio (opcional)"
          value={form.siteName}
          onChange={(e) => setForm((f) => ({ ...f, siteName: e.target.value }))}
        />
        <input
          className="border rounded w-full p-2"
          placeholder="Dirección del sitio (opcional)"
          value={form.siteAddress}
          onChange={(e) =>
            setForm((f) => ({ ...f, siteAddress: e.target.value }))
          }
        />
        <input
          className="border rounded w-full p-2"
          placeholder="Tipo de servicio"
          value={form.type}
          onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
        />
        <textarea
          className="border rounded w-full p-2"
          placeholder="Notas"
          value={form.notes}
          onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
        />
        {err && <p className="text-red-600 text-sm">{err}</p>}
        <button
          disabled={loading}
          className="px-4 py-2 rounded bg-black text-white disabled:opacity-50"
        >
          {loading ? 'Creando...' : 'Crear'}
        </button>
      </form>

      <p className="text-xs text-gray-500 mt-2">
        Si no hay conexión, el servicio se guardará localmente y se enviará
        automáticamente al recuperar la red.
      </p>
    </div>
  )
}