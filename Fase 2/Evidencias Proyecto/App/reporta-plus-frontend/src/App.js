import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import Login from './pages/Login';
import RegistroTecnico from './pages/RegistroTecnico';
import RegistroServicio from './pages/RegistroServicio';
import ListaServicios from './pages/ListaServicios';

function Navbar() {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/');
  };

  return (
    <nav style={{ padding: '1rem', background: '#333', color: '#fff' }}>
      <Link to="/" style={{ marginRight: '1rem', color: '#fff' }}>Inicio</Link>
      {token && (
        <>
          <Link to="/registro-servicio" style={{ marginRight: '1rem', color: '#fff' }}>Registrar Servicio</Link>
          <Link to="/servicios" style={{ marginRight: '1rem', color: '#fff' }}>Ver Servicios</Link>
          <button onClick={handleLogout} style={{ background: 'red', color: '#fff' }}>Cerrar sesión</button>
        </>
      )}
      {!token && (
        <>
          <Link to="/registro-tecnico" style={{ marginRight: '1rem', color: '#fff' }}>Registro Técnico</Link>
        </>
      )}
    </nav>
  );
}

function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/registro-tecnico" element={<RegistroTecnico />} />
        <Route path="/registro-servicio" element={<RegistroServicio />} />
        <Route path="/servicios" element={<ListaServicios />} />
      </Routes>
    </Router>
  );
}

export default App;