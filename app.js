const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const { Pool } = require('pg');

// Configuración de Express y Socket.IO
const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Configuración de la conexión a la base de datos PostgreSQL
const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'entrega_equipos',
    password: 'admin1234',
    port: 5432,
});

// Middleware
app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Función para formatear fecha y hora
const formatearFechaHora = (horario) => {
    const fechaActual = new Date().toISOString().split('T')[0];
    const hora = new Date(horario).toTimeString().split(' ')[0];
    return `${fechaActual} ${hora}`;
};


// Endpoint para registrar pacientes
app.post('/register', async (req, res) => {
    const { nombre, apellido, dni, horario, especialidad, nro_consultorio } = req.body;

    try {
        const paciente = {
            nombre: nombre.toUpperCase(),
            apellido: apellido.toUpperCase(),
            dni: dni.toUpperCase(),
            horario: formatearFechaHora(horario),
            especialidad: especialidad.toUpperCase(),
            nro_consultorio,
        };

        await pool.query(
            'INSERT INTO pacientes (nombre, apellido, dni, horario, especialidad, nro_consultorio) VALUES ($1, $2, $3, $4, $5, $6)',
            [paciente.nombre, paciente.apellido, paciente.dni, paciente.horario, paciente.especialidad, paciente.nro_consultorio]
        );

        // Emitir evento de Socket.IO para el nuevo paciente
        io.emit('nuevo_paciente', paciente);

        res.redirect('/register.html');
    } catch (err) {
        console.error('Error al registrar paciente:', err);
        res.status(500).send('Error al registrar paciente');
    }
});


// Endpoint para obtener información del paciente por DNI
app.get('/paciente', async (req, res) => {
    const { dni } = req.query;
    try {
        const { rows } = await pool.query(
            'SELECT nombre, apellido FROM pacientes WHERE dni = $1',
            [dni]
        );

        if (rows.length > 0) {
            res.json({ success: true, ...rows[0] });
        } else {
            res.json({ success: false, message: 'Paciente no encontrado' });
        }
    } catch (err) {
        console.error('Error al obtener paciente:', err);
        res.status(500).json({ success: false, message: 'Error en el servidor' });
    }
});

// Endpoint para llamar a un paciente
app.get('/llamar/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const { rows } = await pool.query(
            'SELECT nombre, apellido, especialidad, nro_consultorio FROM pacientes WHERE id = $1',
            [id]
        );

        if (rows.length > 0) {
            io.emit('llamada', rows[0]);
            res.redirect('/');
        } else {
            res.status(404).send('Paciente no encontrado');
        }
    } catch (err) {
        console.error('Error al llamar al paciente:', err);
        res.status(500).send('Error al llamar al paciente');
    }
});

// Endpoint para listar pacientes
app.get('/pacientes', async (req, res) => {
    const { nro_consultorio } = req.query;

    try {
        const values = nro_consultorio ? [nro_consultorio] : [];
        const query = `
            SELECT * FROM pacientes 
            WHERE atendido = FALSE ${nro_consultorio ? 'AND nro_consultorio = $1' : ''} 
            ORDER BY horario ASC
        `;
        const { rows } = await pool.query(query, values);
        res.json(rows);
    } catch (err) {
        console.error('Error al obtener pacientes:', err);
        res.status(500).send('Error al obtener pacientes');
    }
});

// Endpoint para actualizar el estado de paciente
app.patch('/atendido/:id', async (req, res) => {
    const { id } = req.params;
    const { motivo } = req.body;

    if (!['ATENDIDO', 'NO ATENDIDO'].includes(motivo)) {
        return res.status(400).send('Motivo no válido');
    }

    try {
        await pool.query(
            'UPDATE pacientes SET atendido = TRUE, motivo = $1 WHERE id = $2',
            [motivo, id]
        );
        io.emit('actualizar_lista');
        res.status(200).send(`Paciente actualizado como ${motivo}`);
    } catch (err) {
        console.error('Error al actualizar paciente:', err);
        res.status(500).send('Error al actualizar paciente');
    }
});

// Configuración de Socket.IO
io.on('connection', (socket) => {
    console.log('Cliente conectado');
    socket.on('disconnect', () => console.log('Cliente desconectado'));
});

// Iniciar el servidor
const PORT = process.env.PORT || 3001;
server.listen(PORT, '0.0.0.0', () => console.log(`Servidor escuchando en el puerto ${PORT}`));
