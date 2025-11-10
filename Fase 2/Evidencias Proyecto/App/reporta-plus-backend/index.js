require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

const authRoutes = require('./src/routes/auth');
const tecnicoRoutes = require('./src/routes/tecnico');
const servicioRoutes = require('./src/routes/servicio');


app.use('/', authRoutes);
app.use('/tecnico', tecnicoRoutes);
app.use('/servicio', servicioRoutes);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
app.get('/', (req, res) => {
  res.send('✅ Conexión exitosa con el backend ReportarUs');
});