const express = require('express');
const router = express.Router();
const pool = require('../../config/db');
const bcrypt = require('bcrypt');

router.post('/crear', async (req, res) => {
  const { nombre, email, password } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO usuarios (nombre, email, password, rol) VALUES ($1, $2, $3, $4) RETURNING *',
      [nombre, email, hashedPassword, 'tecnico']
    );
    res.status(201).json({ mensaje: 'Técnico creado', tecnico: result.rows[0] });
  } catch (error) {
    console.error('Error al crear técnico:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;