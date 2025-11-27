import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import LoginPage from './pages/Login'
import ServiceList from './pages/ServiceList'
import ServiceNew from './pages/ServiceNew'
import ServiceDetail from './pages/ServiceDetail'
import ServiceEdit from './pages/ServiceEdit'

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />

      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<ServiceList />} />
        <Route path="/new" element={<ServiceNew />} />
        <Route path="/s/:id" element={<ServiceDetail />} />
        <Route path="/s/:id/edit" element={<ServiceEdit />} />
      </Routes>
    </BrowserRouter>
  )
}
