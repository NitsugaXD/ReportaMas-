import React from 'react'
import ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider, Navigate, Link } from 'react-router-dom'
import './index.css'
import Login from './pages/Login'
import Services from './pages/Services'
import ServiceNew from './pages/ServiceNew'
import ServiceDetail from './pages/ServiceDetail'
import { useAuth } from './stores/auth'
import { runSync } from './sync/sync'

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
  { path:'/login', element:<Login/> },
  { path:'/', element:<Guard><Services/></Guard> },
  { path:'/new', element:<Guard><ServiceNew/></Guard> },
  { path:'/s/:id', element:<Guard><ServiceDetail/></Guard> },
  { path:'*', element:<div className="p-6">404 <Link className="underline" to="/">Volver</Link></div> },
])

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode><RouterProvider router={router} /></React.StrictMode>
)