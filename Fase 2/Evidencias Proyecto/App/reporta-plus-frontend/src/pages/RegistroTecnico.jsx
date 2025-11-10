import React, { useState } from 'react';
import api from '../services/api';
import '../styles/Form.css';
import { useNavigate } from 'react-router-dom';

function RegistroTecnico() {
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleRegistro = async () => {
    try {
      await api.post('/tecnico/crear', { nombre, email, password });
      alert('Técnico registrado con éxito');
      setNombre('');
      setEmail('');
      setPassword('');
      navigate('/');
    } catch (err) {
      alert(err.response?.data?.error || 'Error al registrar técnico');
    }
    
  };

  return (
    <div className="form-container">
      <h2>Registro de Técnico</h2>
      <input type="text" placeholder="Nombre" value={nombre} onChange={e => setNombre(e.target.value)} />
      <input type="email" placeholder="Correo" value={email} onChange={e => setEmail(e.target.value)} />
      <input type="password" placeholder="Contraseña" value={password} onChange={e => setPassword(e.target.value)} />
      <button onClick={handleRegistro}>Registrar</button>
    </div>
  );
}

export default RegistroTecnico;