const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const { Pool } = require('pg');

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

// Middleware para servir archivos estáticos
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));

// Endpoint para registrar pacientes
app.post('/register', async (req, res) => {
    const { nombre, apellido, dni, horario } = req.body;
    try {
        // Obtener la fecha actual
        const fechaActual = new Date().toISOString().split('T')[0]; // "YYYY-MM-DD"

        // Extraer solo la hora del campo 'horario'
        const hora = new Date(horario).toTimeString().split(' ')[0]; // "HH:MM:SS"

        // Combinar la fecha actual con la hora proporcionada
        const fechaHora = `${fechaActual} ${hora}`; // "YYYY-MM-DD HH:MM:SS"

        // Realizar la consulta para insertar el paciente
        await pool.query(
            'INSERT INTO pacientes (nombre, apellido, dni, horario) VALUES ($1, $2, $3, $4)',
            [nombre, apellido, dni, fechaHora]
        );

        // Emitir el evento a todos los clientes conectados
        io.emit('nuevo_paciente', { nombre, apellido });

        // Redirigir de vuelta al formulario de registro
        res.redirect('/register.html');
    } catch (err) {
        console.error(err);
        res.status(500).send('Error al registrar paciente');
    }
});



// Endpoint para llamar a un paciente
// Endpoint para registrar pacientes
app.get('/llamar/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query('SELECT nombre, apellido FROM pacientes WHERE id = $1', [id]);
        const paciente = result.rows[0];
        io.emit('llamada', paciente); // Emitir el evento de llamada a todos los clientes
        res.redirect('/');
    } catch (err) {
        console.error(err);
        res.status(500).send('Error al registrar paciente');
    }
});


// Endpoint para obtener pacientes que no han sido atendidos
app.get('/pacientes', async (req, res) => {
    try {
        const query = 'SELECT * FROM pacientes WHERE atendido = FALSE ORDER BY horario ASC';
        console.log('Ejecutando consulta:', query); // Para verificar la consulta
        const result = await pool.query(query);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).send('Error al obtener pacientes');
    }
});

// Endpoint para marcar un paciente como atendido
app.patch('/atendido/:id', async (req, res) => { // Cambia PUT a PATCH aquí
    const { id } = req.params;
    try {
        // Actualizar el campo 'atendido' a TRUE para el paciente con el ID dado
        await pool.query('UPDATE pacientes SET atendido = TRUE WHERE id = $1', [id]);

        // Emitir un evento para actualizar la lista de pacientes en tiempo real
        io.emit('actualizar_lista');

        res.status(200).send('Paciente actualizado como atendido');
    } catch (err) {
        console.error(err);
        res.status(500).send('Error al actualizar paciente');
    }
});


// Configuración del Socket.IO
io.on('connection', (socket) => {
    console.log('Cliente conectado');
    socket.on('disconnect', () => {
        console.log('Cliente desconectado');
    });
});

// Iniciar el servidor
/*const PORT = 3001;
server.listen(PORT, () => {
    console.log(`Servidor escuchando en el puerto ${PORT}`);
});
*/
const PORT = process.env.PORT || 3001; // Puedes usar una variable de entorno para el puerto
server.listen(PORT, '0.0.0.0', () => { // '0.0.0.0' para escuchar en todas las interfaces de red
    console.log(`Servidor escuchando en el puerto ${PORT}`);
});