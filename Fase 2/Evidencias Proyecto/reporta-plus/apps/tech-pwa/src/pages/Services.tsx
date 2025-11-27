import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../api/client'
import { useAuth } from '../stores/auth'
import logo from '../assets/logo-reporta-plus.png'
import AnimatedButton from '../components/AnimatedButton'
import Loader from '../components/Loader'
import { motion, AnimatePresence } from 'framer-motion'

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
  const nav = useNavigate()

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

  // --- Animación lateral
  const sidebarVariants = {
    hidden: { x: -320, opacity: 0, transition: { type: "spring" as const, stiffness: 350, damping: 30 } },
    visible: { x: 0, opacity: 1, transition: { type: "spring" as const, stiffness: 60, damping: 14 } },
    exit: { x: -320, opacity: 0, transition: { type: "spring" as const, stiffness: 200, damping: 32 } },
  }

  return (
    <div className="min-h-screen px-4 py-6 bg-base-light text-tmain-light dark:bg-base-dark dark:text-tmain-dark transition-colors relative overflow-x-hidden">
      {/* Esferas decorativas estilo Login */}
      <div className="pointer-events-none absolute inset-0 z-0">
        <div className="absolute -top-40 -left-32 w-[350px] h-[350px] rounded-full bg-brand-soft blur-3xl opacity-60 dark:bg-brand-darkSoft" />
        <div className="absolute -bottom-48 -right-24 w-[390px] h-[380px] rounded-full bg-accent-light blur-3xl opacity-60 dark:bg-accent-dark" />
      </div>
      <div className="z-10 max-w-3xl mx-auto relative">

        {/* HEADER */}
        <header className="flex items-center gap-2 mb-6">
          {/* Botón menú hamburguesa */}
          <AnimatedButton
            type="button"
            onClick={() => setShowMenu(true)}
            className="flex flex-col justify-center gap-0.5 w-10 h-10 rounded-lg border border-borderc-light bg-card-light hover:bg-base-light active:scale-[0.96] transition dark:border-borderc-dark dark:bg-card-dark dark:hover:bg-base-dark !py-0 !px-0"
          >
            <span className="block h-[2px] w-6 mx-auto rounded bg-tmain-light dark:bg-tmain-dark" />
            <span className="block h-[2px] w-6 mx-auto rounded bg-tmain-light dark:bg-tmain-dark" />
            <span className="block h-[2px] w-6 mx-auto rounded bg-tmain-light dark:bg-tmain-dark" />
          </AnimatedButton>

          {/* Buscador */}
          <input
            className="rounded-lg px-3 py-2 flex-1 text-base border border-borderc-light bg-card-light text-tmain-light placeholder:text-tmuted-light focus:outline-none focus:ring-2 focus:ring-brand-primary transition dark:bg-card-dark dark:border-borderc-dark dark:text-tmain-dark dark:placeholder:text-tmuted-dark mr-3"
            placeholder="Buscar por cliente, dirección, tipo, fecha o UID..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />

          <motion.div whileTap={{ scale: 0.97 }} whileHover={{ scale: 1.04 }}>
            <Link
              to="/new"
              className="px-4 py-2 rounded-lg font-semibold text-white bg-gradient-to-r from-brand-primary to-accent-light shadow-md hover:brightness-110 transition focus:outline-none focus:ring-2 focus:ring-accent-light active:scale-95 text-base"
            >
              + Nuevo
            </Link>
          </motion.div>
        </header>

        {loading && <Loader />}

        {/* LISTA DE SERVICIOS */}
        <ul className="space-y-4">
          {items.map((s) => {
            const titleName = s.site?.name || s.client?.name || 'Sin nombre'
            const mainPhoto = s.files?.find((f) => f.kind === 'PHOTO') ?? null

            return (
              <motion.li
                key={s.id}
                className="rounded-xl p-4 flex gap-4 items-center shadow-md border border-borderc-light bg-card-light hover:shadow-lg hover:scale-[1.01] transition dark:bg-card-dark dark:border-borderc-dark"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
              >
                {mainPhoto ? (
                  <img
                    src={mainPhoto.url}
                    alt="Foto principal"
                    className="w-16 h-16 rounded object-cover flex-shrink-0 border border-borderc-light"
                  />
                ) : (
                  <div className="w-16 h-16 rounded flex items-center justify-center bg-base-light dark:bg-base-dark border border-borderc-light text-tmuted-light dark:text-tmuted-dark">
                    Sin foto
                  </div>
                )}
                <div className="flex-1">
                  <div className="font-bold text-lg text-brand-primary dark:text-brand-darkPrimary">
                    {titleName}
                  </div>
                  <div className="text-base font-medium text-accent-light dark:text-accent-dark">
                    {s.type}
                  </div>
                  <div className="text-xs text-tmuted-light dark:text-tmuted-dark">
                    {new Date(s.date).toLocaleString()} — {getStatusLabel(s.status)}
                  </div>
                  <div className="text-xs text-tmuted-light dark:text-tmuted-dark">
                    UID: {s.serviceUid}
                  </div>
                </div>
                <motion.button
                  type="button"
                  onClick={() => nav(`/s/${s.id}`)}
                  className="px-6 py-2 rounded-full font-bold bg-gradient-to-r from-brand-primary to-accent-light text-white shadow focus:outline-none ring-2 ring-transparent hover:ring-brand-primary text-base active:scale-95 transition hover:brightness-110 hover:scale-105"
                  whileTap={{ scale: 0.95 }}
                  whileHover={{ scale: 1.08 }}
                >
                  Ver
                </motion.button>
              </motion.li>
            )
          })}
        </ul>

        {/* MENÚ LATERAL */}
        <AnimatePresence>
          {showMenu && (
            <>
              {/* Fondo oscuro */}
              <motion.div
                key="backdrop"
                className="fixed inset-0 bg-black/40 z-40"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowMenu(false)}
              />
              {/* Panel lateral */}
              <motion.div
                key="sidebar"
                className="fixed left-0 top-0 z-50 h-full w-72 max-w-[80vw] bg-card-light dark:bg-card-dark border-r border-borderc-light dark:border-borderc-dark shadow-xl flex flex-col"
                variants={sidebarVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
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
                      Plataforma para técnicos
                    </div>
                  </div>
                </div>
                <nav className="flex-1 px-2 py-3 text-base">
                  <Link
                    to="/direcciones"
                    className="block px-3 py-2 rounded-lg font-medium hover:bg-accent-light/15 dark:hover:bg-accent-dark/15 transition text-brand-primary dark:text-brand-darkPrimary"
                    onClick={() => setShowMenu(false)}
                  >
                    Direcciones
                  </Link>
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
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}