import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/client'
import { useAuth } from '../stores/auth'
import logo from '../assets/logo-reporta-plus.png'
import AnimatedButton from '../components/AnimatedButton'
import Loader from '../components/Loader'
import { motion } from 'framer-motion'

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
  const user = useAuth((s) => s.user)

  const [isDark, setIsDark] = useState(() => {
    if (typeof window === 'undefined') return false
    const stored = localStorage.getItem('theme')
    return stored === 'dark'
  })

  const [showMenu, setShowMenu] = useState(false)

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

  useEffect(() => {
    fetchServices('')
  }, [])

  useEffect(() => {
    const id = setTimeout(() => {
      fetchServices(q)
    }, 300)
    return () => clearTimeout(id)
  }, [q])

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

  function handleSync() {
    alert(
      'Sincronización offline: pendiente de implementar (cuando definamos el flujo completo de outbox).'
    )
  }

  return (
    <div className="min-h-screen px-4 py-6 bg-base-light text-tmain-light dark:bg-base-dark dark:text-tmain-dark transition-colors">
      <div className="max-w-3xl mx-auto relative">

        {/* HEADER */}
        <header className="flex items-center gap-2 mb-4">

          {/* Botón menú hamburguesa */}
          <AnimatedButton
            type="button"
            onClick={() => setShowMenu(true)}
            className="flex flex-col justify-center gap-0.5 w-9 h-9 rounded-lg border border-borderc-light bg-card-light hover:bg-base-light active:scale-[0.96] transition dark:border-borderc-dark dark:bg-card-dark dark:hover:bg-base-dark !py-0 !px-0"
          >
            <span className="block h-[2px] w-4 mx-auto rounded bg-tmain-light dark:bg-tmain-dark" />
            <span className="block h-[2px] w-4 mx-auto rounded bg-tmain-light dark:bg-tmain-dark" />
            <span className="block h-[2px] w-4 mx-auto rounded bg-tmain-light dark:bg-tmain-dark" />
          </AnimatedButton>

          {/* Buscador */}
          <input
            className="rounded px-3 py-2 flex-1 text-sm border border-borderc-light bg-card-light text-tmain-light placeholder:text-tmuted-light focus:outline-none focus:ring-2 focus:ring-brand-primary transition dark:bg-card-dark dark:border-borderc-dark dark:text-tmain-dark dark:placeholder:text-tmuted-dark"
            placeholder="Buscar por cliente, dirección, tipo, fecha o UID..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />

          <AnimatedButton
            type="button"
            onClick={() => fetchServices(q)}
            className="text-sm font-medium"
          >
            Buscar
          </AnimatedButton>
          
          <motion.div whileTap={{ scale: 0.97 }} whileHover={{ scale: 1.04 }}>
            <Link
              to="/new"
              className="px-4 py-2 rounded font-semibold text-white bg-gradient-to-r from-brand-primary to-accent-light shadow-md hover:brightness-110 transition focus:outline-none focus:ring-2 focus:ring-accent-light active:scale-95 text-sm font-medium"
            >
              Nuevo
            </Link>
          </motion.div>
        </header>

        {loading && <Loader />}

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
                <motion.div whileTap={{ scale: 0.97 }} whileHover={{ scale: 1.04 }}>
                  <Link
                    to={`/s/${s.id}`}
                    className="px-4 py-2 rounded font-semibold text-white bg-gradient-to-r from-brand-primary to-accent-light shadow-md hover:brightness-110 transition focus:outline-none focus:ring-2 focus:ring-accent-light active:scale-95 text-sm underline mt-1"
                  >
                    Ver
                  </Link>
                </motion.div>
              </li>
            )
          })}
        </ul>

        {/* MENÚ LATERAL */}
        {showMenu && (
          <div className="fixed inset-0 z-40 flex">
            {/* Panel */}
            <div className="w-72 max-w-[75%] h-full bg-card-light dark:bg-card-dark border-r border-borderc-light dark:border-borderc-dark shadow-xl flex flex-col">
              <div className="px-4 pt-4 pb-3 border-b border-borderc-light dark:border-borderc-dark flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-base-light dark:bg-base-dark border border-borderc-light dark:border-borderc-dark flex items-center justify-center">
                  {logo ? (
                    <img
                      src={logo}
                      alt="Reporta+"
                      className="w-8 h-8 object-contain"
                    />
                  ) : (
                    <span className="text-lg font-bold text-brand-primary">
                      R+
                    </span>
                  )}
                </div>
                <div>
                  <div className="text-sm font-semibold tracking-tight">
                    Reporta+
                  </div>
                  <div className="text-[11px] text-tmuted-light dark:text-tmuted-dark">
                    Guías y servicios
                  </div>
                </div>
              </div>
              <nav className="flex-1 px-2 py-3 text-sm">
                <Link
                  to="/direcciones"
                  className="block px-3 py-2 rounded-lg hover:bg-base-light dark:hover:bg-base-dark transition"
                  onClick={() => setShowMenu(false)}
                >
                  Direcciones
                </Link>
                <Link
                  to="/"
                  className="block px-3 py-2 rounded-lg hover:bg-base-light dark:hover:bg-base-dark transition"
                  onClick={() => setShowMenu(false)}
                >
                  Guías de mantención
                </Link>
                <Link
                  to="/"
                  className="block px-3 py-2 rounded-lg hover:bg-base-light dark:hover:bg-base-dark transition"
                  onClick={() => setShowMenu(false)}
                >
                  Guías de servicio
                </Link>
                <AnimatedButton
                  type="button"
                  onClick={handleSync}
                  className="mt-2 block w-full text-left px-3 py-2 rounded-lg border border-borderc-light bg-card-light text-tmain-light hover:bg-base-light active:scale-[0.98] transition dark:border-borderc-dark dark:bg-card-dark dark:text-tmain-dark dark:hover:bg-base-dark"
                >
                  Sincronizar offline
                </AnimatedButton>
              </nav>
              <div className="px-3 pb-3 pt-2 border-t border-borderc-light dark:border-borderc-dark">
                <AnimatedButton
                  type="button"
                  onClick={() => setIsDark((v) => !v)}
                  className="w-full mb-2 px-3 py-2 text-xs rounded-lg border border-borderc-light bg-card-light text-tmuted-light hover:bg-base-light active:scale-[0.98] transition dark:border-borderc-dark dark:bg-card-dark dark:text-tmuted-dark dark:hover:bg-base-dark"
                >
                  {isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
                </AnimatedButton>
                <div className="flex items-center justify-between text-xs text-tmuted-light dark:text-tmuted-dark">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">
                      {user?.name || 'Usuario'}
                    </div>
                    <div className="truncate">
                      {user?.email || 'sin correo'}
                    </div>
                  </div>
                  <AnimatedButton
                    type="button"
                    onClick={logout}
                    className="ml-3 px-3 py-1.5 rounded border border-borderc-light bg-card-light text-tmuted-light hover:bg-base-light text-xs active:scale-[0.98] transition dark:border-borderc-dark dark:bg-card-dark dark:text-tmuted-dark dark:hover:bg-base-dark"
                  >
                    Cerrar sesión
                  </AnimatedButton>
                </div>
              </div>
            </div>
            {/* FONDO OSCURO */}
            <button
              type="button"
              className="flex-1 bg-black/40"
              onClick={() => setShowMenu(false)}
            />
          </div>
        )}
      </div>
    </div>
  )
}