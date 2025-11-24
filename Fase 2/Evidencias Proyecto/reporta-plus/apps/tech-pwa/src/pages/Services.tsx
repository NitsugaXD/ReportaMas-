import { useEffect, useState } from 'react'
import api from '../api/client'
import { Link } from 'react-router-dom'
import { useAuth } from '../stores/auth'

type FileKind = 'PHOTO' | 'SIGNATURE' | 'PDF' | 'XLSX'

type ServiceFile = {
  id: string
  kind: FileKind
  url: string
}

type Item = {
  id: string
  serviceUid: string
  type: string
  status: string
  date: string
  client?: { name: string }
  site?: { name?: string; address?: string }
  files?: ServiceFile[]
}

function getStatusLabel(status: string) {
  switch (status) {
    case 'DONE':
      return 'Finalizado'
    case 'DRAFT':
    default:
      return 'Creado / Editado'
  }
}

export default function Services() {
  const [items, setItems] = useState<Item[]>([])
  const [q, setQ] = useState('')
  const logout = useAuth((s) => s.logout)
  const [isDark, setIsDark] = useState(() => {
    if (typeof window === 'undefined') return false
    return localStorage.getItem('theme') === 'dark'
  })

  async function load() {
    const { data } = await api.get('/services', {
      params: { q, page: 1, pageSize: 20 },
    })
    setItems(data.items)
  }

  useEffect(() => {
    load()
  }, [])

  useEffect(() => {
    localStorage.setItem('theme', isDark ? 'dark' : 'light')
  }, [isDark])

  return (
    <div
      className={`min-h-screen px-4 py-6 ${
        isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-100 text-slate-900'
      }`}
    >
      <div className="max-w-3xl mx-auto">
        <header className="flex items-center gap-2 mb-4">
          <input
            className={`rounded px-3 py-2 flex-1 text-sm border transition ${
              isDark
                ? 'bg-slate-900 border-slate-700 placeholder:text-slate-500'
                : 'bg-white border-slate-300 placeholder:text-slate-400'
            }`}
            placeholder="Buscar por texto/UID..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <button
            onClick={load}
            className="px-3 py-2 rounded text-sm bg-black text-white hover:scale-[1.02] hover:shadow-md transition"
          >
            Buscar
          </button>
          <Link
            to="/new"
            className="px-3 py-2 rounded text-sm bg-emerald-600 text-white hover:scale-[1.02] hover:shadow-md transition"
          >
            Nuevo
          </Link>
          <button
            onClick={() => setIsDark((v) => !v)}
            className="px-3 py-2 rounded text-xs bg-slate-800 text-white hover:scale-[1.02] transition"
          >
            {isDark ? 'Modo claro' : 'Modo oscuro'}
          </button>
          <button
            onClick={logout}
            className={`px-3 py-2 rounded text-sm ${
              isDark
                ? 'bg-slate-800 text-slate-100'
                : 'bg-slate-200 text-slate-800'
            } hover:scale-[1.02] transition`}
          >
            Salir
          </button>
        </header>

        <ul className="space-y-2">
          {items.map((s) => {
            const titleName =
              s.site?.name || s.client?.name || 'Sin nombre'

            const mainPhoto = s.files?.find((f) => f.kind === 'PHOTO')

            return (
              <li
                key={s.id}
                className={`rounded-xl p-3 flex gap-3 items-start shadow-sm border transition hover:shadow-md hover:translate-y-[1px] ${
                  isDark
                    ? 'bg-slate-900 border-slate-800'
                    : 'bg-white border-slate-200'
                }`}
              >
                {mainPhoto && (
                  <img
                    src={mainPhoto.url}
                    alt="Foto principal"
                    className="w-16 h-16 rounded object-cover flex-shrink-0"
                  />
                )}

                <div className="flex-1">
                  <div className="font-semibold text-sm">
                    {s.type} • {titleName}
                  </div>
                  <div className="text-xs text-gray-500">
                    {new Date(s.date).toLocaleString()} —{' '}
                    {getStatusLabel(s.status)}
                  </div>
                  <div className="text-[11px] text-gray-500">
                    UID: {s.serviceUid}
                  </div>
                </div>

                <Link
                  to={`/s/${s.id}`}
                  className="text-sm underline mt-1 hover:opacity-80 transition"
                >
                  Ver
                </Link>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}