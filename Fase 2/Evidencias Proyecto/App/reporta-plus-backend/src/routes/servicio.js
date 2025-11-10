const express = require('express');
const router = express.Router();
const pool = require('../../config/db'); // ← corregido el path
const multer = require('multer');
const verificarToken = require('../middleware/auth');

const storage = multer.memoryStorage();
const upload = multer({ storage });

/**
 * POST /servicio/registrar
 * Registra un nuevo servicio técnico
 */
router.post('/registrar', verificarToken, upload.fields([
  { name: 'fotos', maxCount: 5 },
  { name: 'firma', maxCount: 1 }
]), async (req, res) => {
  try {
    const { cliente, descripcion } = req.body;
    const tecnicoId = req.user.id;

    const fotos = req.files['fotos']?.map(file => file.buffer.toString('base64')) || [];
    const firma = req.files['firma']?.[0]?.buffer.toString('base64') || null;

    const result = await pool.query(
      'INSERT INTO servicios (tecnico_id, cliente, descripcion, fotos, firma) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [tecnicoId, cliente, descripcion, fotos, firma]
    );

    res.status(201).json({ mensaje: 'Servicio registrado', servicio: result.rows[0] });
  } catch (error) {
    console.error('❌ Error al registrar servicio:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

/**
 * GET /servicio/listar
 * Lista los servicios del técnico autenticado
 */
router.get('/listar', verificarToken, async (req, res) => {
  try {
    const tecnicoId = req.user.id;
    const result = await pool.query(
      'SELECT * FROM servicios WHERE tecnico_id = $1 ORDER BY id DESC',
      [tecnicoId]
    );

    const servicios = result.rows.map(s => ({
      ...s,
      fotos: Array.isArray(s.fotos) ? s.fotos : [],
      firma: typeof s.firma === 'string' ? s.firma : null
    }));

    res.json({ servicios });
  } catch (error) {
    console.error('❌ Error al listar servicios:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;