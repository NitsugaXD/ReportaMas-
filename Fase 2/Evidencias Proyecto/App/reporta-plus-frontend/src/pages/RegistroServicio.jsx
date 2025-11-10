import React, { useState } from 'react';
import api from '../services/api';
import '../styles/Form.css';

function RegistroServicio() {
  const [cliente, setCliente] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [fotos, setFotos] = useState([]);
  const [firma, setFirma] = useState(null);

  const handleSubmit = async () => {
    const formData = new FormData();
    formData.append('cliente', cliente);
    formData.append('descripcion', descripcion);
    fotos.forEach(f => formData.append('fotos', f));
    if (firma) formData.append('firma', firma);

    try {
      const token = localStorage.getItem('token');
      await api.post('/servicio/registrar', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      alert('Servicio registrado');
      setCliente('');
      setDescripcion('');
      setFotos([]);
      setFirma(null);
    } catch (err) {
      alert(err.response?.data?.error || 'Error al registrar servicio');
    }
  };

  return (
    <div className="form-container">
      <h2>Registrar Servicio Técnico</h2>
      <input type="text" placeholder="Cliente" value={cliente} onChange={e => setCliente(e.target.value)} />
      <textarea placeholder="Descripción" value={descripcion} onChange={e => setDescripcion(e.target.value)} />
      <label>Fotos:</label>
      <input type="file" multiple onChange={e => setFotos([...e.target.files])} />
      <label>Firma:</label>
      <input type="file" onChange={e => setFirma(e.target.files[0])} />
      <button onClick={handleSubmit}>Registrar Servicio</button>
    </div>
  );
}

export default RegistroServicio;