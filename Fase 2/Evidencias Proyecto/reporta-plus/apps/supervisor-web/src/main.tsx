import React from 'react'
import ReactDOM from 'react-dom/client'
import './styles/ui.css' // Importar estilos globales aquí
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom'
import './App.css'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import ServicesList from './pages/ServicesList'
import ServiceDetail from './pages/ServiceDetail'
import ServiceEdit from './pages/ServiceEdit'
import UsersList from './pages/UsersList'
import ClientsList from './pages/ClientsList'
import AppLayout from './components/AppLayout'

function isAuth() {
  return !!localStorage.getItem('access_token')
}

function Guard({ children }:{children:React.ReactNode}) {
  if (!isAuth()) return <Navigate to="/login" replace />
  return <>{children}</>
}

const router = createBrowserRouter([
  { path: '/', element: <Navigate to="/login" replace /> },
  { path: '/login', element: <Login /> },

  { path: '/dashboard', element: <Guard><AppLayout><Dashboard/></AppLayout></Guard> },
  { path: '/services', element: <Guard><AppLayout><ServicesList/></AppLayout></Guard> },
  { path: '/services/new', element: <Guard><AppLayout><ServiceEdit/></AppLayout></Guard> },
  { path: '/services/:id', element: <Guard><AppLayout><ServiceDetail/></AppLayout></Guard> },
  { path: '/services/:id/edit', element: <Guard><AppLayout><ServiceEdit/></AppLayout></Guard> },
  { path: '/users', element: <Guard><AppLayout><UsersList/></AppLayout></Guard> },
  { path: '/clients', element: <Guard><AppLayout><ClientsList/></AppLayout></Guard> },

  { path: '*', element: <Navigate to="/login" replace /> },
])

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode><RouterProvider router={router} /></React.StrictMode>
)