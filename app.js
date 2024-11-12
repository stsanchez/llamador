const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const { Pool } = require('pg');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Configuración de la conexión a la base de datos PostgreSQL aslkjd
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
// Endpoint para registrar pacientes
app.post('/register', async (req, res) => {
    const { nombre, apellido, dni, horario, especialidad, nro_consultorio } = req.body; // Incluye los nuevos campos
    try {
        // Convertir los campos a mayúsculas
        const nombreMayus = nombre.toUpperCase();
        const apellidoMayus = apellido.toUpperCase();
        const dniMayus = dni.toUpperCase();
        const especialidadMayus = especialidad.toUpperCase();

        // Obtener la fecha actual
        const fechaActual = new Date().toISOString().split('T')[0]; // "YYYY-MM-DD"

        // Extraer solo la hora del campo 'horario'
        const hora = new Date(horario).toTimeString().split(' ')[0]; // "HH:MM:SS"

        // Combinar la fecha actual con la hora proporcionada
        const fechaHora = `${fechaActual} ${hora}`; // "YYYY-MM-DD HH:MM:SS"

        // Realizar la consulta para insertar el paciente
        await pool.query(
            'INSERT INTO pacientes (nombre, apellido, dni, horario, especialidad, nro_consultorio) VALUES ($1, $2, $3, $4, $5, $6)',
            [nombreMayus, apellidoMayus, dniMayus, fechaHora, especialidadMayus, nro_consultorio]
        );

        // Emitir el evento a todos los clientes conectados
        io.emit('nuevo_paciente', { nombre: nombreMayus, apellido: apellidoMayus, especialidad: especialidadMayus, nro_consultorio });

        // Redirigir de vuelta al formulario de registro
        res.redirect('/register.html');
    } catch (err) {
        console.error(err);
        res.status(500).send('Error al registrar paciente');
    }
});


// Endpoint para obtener información del paciente por DNI
app.get('/paciente', async (req, res) => {
    const { dni } = req.query;
    try {
        const result = await pool.query('SELECT nombre, apellido FROM pacientes WHERE dni = $1', [dni]);
        if (result.rows.length > 0) {
            // Si el paciente existe, devolver su nombre y apellido
            res.json({ success: true, nombre: result.rows[0].nombre, apellido: result.rows[0].apellido });
        } else {
            // Si no existe, devolver un mensaje de error
            res.json({ success: false, message: 'Paciente no encontrado' });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Error en el servidor' });
    }
});


// Endpoint para llamar a un paciente
// Endpoint para registrar pacientes
app.get('/llamar/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query('SELECT nombre, apellido, especialidad, nro_consultorio FROM pacientes WHERE id = $1', [id]);
        const paciente = result.rows[0];
        io.emit('llamada', paciente); // Emitir evento con los datos del paciente
        res.redirect('/');
    } catch (err) {
        console.error(err);
        res.status(500).send('Error al llamar al paciente');
    }
});



app.get('/pacientes', async (req, res) => {
    const { nro_consultorio } = req.query; // Obtener el número de consultorio de los parámetros de consulta
    try {
        // Inicializar el query y los valores dependiendo si se pasa o no nro_consultorio
        let query = 'SELECT * FROM pacientes WHERE atendido = FALSE';
        let values = [];

        if (nro_consultorio) {
            query += ' AND nro_consultorio = $1 ORDER BY horario ASC';
            values = [nro_consultorio]; // Asignar el nro_consultorio a los valores
        } else {
            query += ' ORDER BY horario ASC'; // Si no hay consultorio, solo ordenar
        }

        const result = await pool.query(query, values); // Pasar los valores a la consulta
        console.log('Pacientes obtenidos:', result.rows); // Para depuración
        res.json(result.rows); // Enviar los pacientes como respuesta
    } catch (err) {
        console.error(err);
        res.status(500).send('Error al obtener pacientes');
    }
});

app.use(express.json()); // Agrega esta línea si no la tienes

app.patch('/atendido/:id', async (req, res) => {
    const { id } = req.params;
    const { motivo } = req.body; // Obtener el motivo del cuerpo de la solicitud (ATENDIDO o NO ATENDIDO)

    // Validar que el motivo sea uno de los valores esperados
    if (motivo !== 'ATENDIDO' && motivo !== 'NO ATENDIDO') {
        return res.status(400).send('Motivo no válido. Debe ser "ATENDIDO" o "NO ATENDIDO".');
    }

    try {
        // Actualizar el paciente en la base de datos, estableciendo 'atendido' a TRUE y el campo 'motivo'
        await pool.query(
            'UPDATE pacientes SET atendido = TRUE, motivo = $1 WHERE id = $2',
            [motivo, id]  // Inserta el valor de motivo (ATENDIDO o NO ATENDIDO)
        );

        // Emitir un evento para actualizar la lista de pacientes en tiempo real
        io.emit('actualizar_lista');

        // Responder al cliente con el mensaje de éxito
        res.status(200).send(`Paciente actualizado como ${motivo}`);
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
