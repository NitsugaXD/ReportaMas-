import React, { useEffect, useState } from 'react';
import api from '../services/api';
import '../styles/Form.css';

function ListaServicios() {
  const [servicios, setServicios] = useState([]);

  useEffect(() => {
    const fetchServicios = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await api.get('/servicio/listar', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setServicios(res.data.servicios);
      } catch (err) {
        alert(err.response?.data?.error || 'Error al cargar servicios');
      }
    };
    fetchServicios();
  }, []);

  return (
    <div className="form-container">
      <h2>Servicios Registrados</h2>
      <table border="1" cellPadding="10" style={{ width: '100%' }}>
        <thead>
          <tr>
            <th>Cliente</th>
            <th>Descripción</th>
            <th>Fotos</th>
            <th>Firma</th>
          </tr>
        </thead>
        <tbody>
          {servicios.map(s => (
            <tr key={s.id}>
              <td>{s.cliente}</td>
              <td>{s.descripcion}</td>
              <td>{s.fotos.map((f, i) => (
                <img key={i} src={`data:image/jpeg;base64,${f}`} alt="foto" width="100" />
              ))}</td>
              <td>{s.firma && <img src={`data:image/jpeg;base64,${s.firma}`} alt="firma" width="100" />}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default ListaServicios;