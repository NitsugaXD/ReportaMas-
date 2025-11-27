import React from 'react'
import ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider, Navigate, Link } from 'react-router-dom'
import './index.css'
import Login from './pages/Login'
import Services from './pages/Services'
import ServiceNew from './pages/ServiceNew'
import ServiceDetail from './pages/ServiceDetail'
import ServiceEdit from './pages/ServiceEdit'
import { useAuth } from './stores/auth'
import { runSync } from './sync/sync'
import AppLayout from './components/AppLayout'

function Guard({ children }:{children:React.ReactNode}) {
  const user = useAuth(s=>s.user)
  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}

if (navigator.onLine) runSync()
window.addEventListener('online', () => runSync())
setInterval(() => {
  if (navigator.onLine) runSync()
}, 15000)

const router = createBrowserRouter([
  { path:'/login', element:<AppLayout><Login/></AppLayout> },
  { path:'/', element:<Guard><AppLayout><Services/></AppLayout></Guard> },
  { path:'/new', element:<Guard><AppLayout><ServiceNew/></AppLayout></Guard> },
  { path:'/s/:id', element:<Guard><AppLayout><ServiceDetail/></AppLayout></Guard> },
  { path:'/s/:id/edit', element:<Guard><AppLayout><ServiceEdit/></AppLayout></Guard> },
  { path:'*', element:<AppLayout><div className="p-6">404 <Link className="underline" to="/">Volver</Link></div></AppLayout> }
])

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode><RouterProvider router={router} /></React.StrictMode>
)