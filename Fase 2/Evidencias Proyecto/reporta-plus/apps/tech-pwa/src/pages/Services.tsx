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
  const [loading, setLoading] = useState(false)
  const logout = useAuth((s) => s.logout)

  const [isDark, setIsDark] = useState(() => {
    if (typeof window === 'undefined') return false
    const stored = localStorage.getItem('theme')
    return stored === 'dark'
  })

  async function fetchServices(term: string) {
    setLoading(true)
    try {
      const { data } = await api.get('/services', {
        params: { q: term, page: 1, pageSize: 20 },
      })
      setItems(data.items)
    } finally {
      setLoading(false)
    }
  }

  // carga inicial
  useEffect(() => {
    fetchServices('')
  }, [])

  // búsqueda automática con debounce
  useEffect(() => {
    const id = setTimeout(() => {
      fetchServices(q)
    }, 300)

    return () => clearTimeout(id)
  }, [q])

  // sincroniza dark mode con <html class="dark">
  useEffect(() => {
    if (typeof document === 'undefined') return
    const root = document.documentElement
    if (isDark) {
      root.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      root.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
  }, [isDark])

  return (
    <div className="min-h-screen px-4 py-6 bg-base-light text-tmain-light dark:bg-base-dark dark:text-tmain-dark transition-colors">
      <div className="max-w-3xl mx-auto">
        {/* HEADER / BARRA SUPERIOR */}
        <header className="flex items-center gap-2 mb-4">
          <input
            className="rounded px-3 py-2 flex-1 text-sm border border-borderc-light bg-card-light text-tmain-light placeholder:text-tmuted-light focus:outline-none focus:ring-2 focus:ring-brand-primary transition dark:bg-card-dark dark:border-borderc-dark dark:text-tmain-dark dark:placeholder:text-tmuted-dark"
            placeholder="Buscar por cliente, dirección, tipo, fecha o UID..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />

          {/* Botón opcional, por si el técnico quiere forzar recarga */}
          <button
            onClick={() => fetchServices(q)}
            className="px-3 py-2 rounded text-sm font-medium text-white bg-brand-primary hover:bg-brand-hover active:scale-[0.98] hover:shadow-md transition"
          >
            Buscar
          </button>

          <Link
            to="/new"
            className="px-3 py-2 rounded text-sm font-medium text-white bg-brand-primary hover:bg-brand-hover active:scale-[0.98] hover:shadow-md transition"
          >
            Nuevo
          </Link>

          <button
            onClick={() => setIsDark((v) => !v)}
            className="px-3 py-2 rounded text-xs font-medium border border-borderc-light bg-card-light text-tmuted-light hover:bg-base-light active:scale-[0.98] transition dark:border-borderc-dark dark:bg-card-dark dark:text-tmuted-dark dark:hover:bg-base-dark"
          >
            {isDark ? 'Modo claro' : 'Modo oscuro'}
          </button>

          <button
            onClick={logout}
            className="px-3 py-2 rounded text-sm font-medium border border-borderc-light bg-card-light text-tmuted-light hover:bg-base-light active:scale-[0.98] transition dark:border-borderc-dark dark:bg-card-dark dark:text-tmuted-dark dark:hover:bg-base-dark"
          >
            Salir
          </button>
        </header>

        {loading && (
          <p className="text-xs text-tmuted-light dark:text-tmuted-dark mb-2">
            Buscando...
          </p>
        )}

        {/* LISTA DE SERVICIOS */}
        <ul className="space-y-3">
          {items.map((s) => {
            const titleName = s.site?.name || s.client?.name || 'Sin nombre'
            const mainPhoto = s.files?.find((f) => f.kind === 'PHOTO') ?? null

            return (
              <li
                key={s.id}
                className="rounded-xl p-3 flex gap-3 items-start shadow-sm border border-borderc-light bg-card-light hover:shadow-md hover:translate-y-[1px] transition dark:bg-card-dark dark:border-borderc-dark"
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
                  <div className="text-xs text-tmuted-light dark:text-tmuted-dark mt-0.5">
                    {new Date(s.date).toLocaleString()} —{' '}
                    {getStatusLabel(s.status)}
                  </div>
                  <div className="text-[11px] text-tmuted-light dark:text-tmuted-dark mt-0.5">
                    UID: {s.serviceUid}
                  </div>
                </div>

                <Link
                  to={`/s/${s.id}`}
                  className="text-sm underline mt-1 text-brand-primary hover:text-brand-hover transition"
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