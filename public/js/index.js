document.addEventListener('DOMContentLoaded', () => {
    const socket = io();
    const notificationElement = document.getElementById('notification');
    const consultarBtn = document.getElementById('consultar-btn');
    const consultorioSelect = document.getElementById('consultorio-select');

    // Manejar la notificación de llamada
    socket.on('llamada', (data) => {
        notificationElement.textContent = `Llamando a ${data.nombre} ${data.apellido}`;
        notificationElement.style.display = 'block';
        setTimeout(() => {
            notificationElement.style.display = 'none';
        }, 5000); // Mostrar por 5 segundos
    });

    // Función para llamar a un paciente
    window.llamarPaciente = (id) => {
        fetch(`/llamar/${id}`);
    };

    // Función para marcar a un paciente como atendido o no atendido
    window.marcarAtendido = (id, motivo) => {
        fetch(`/atendido/${id}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ motivo }),
        }).then(() => {
            // Actualizar la lista de pacientes después de marcarlo
            const item = document.querySelector(`[data-id="${id}"]`);
            if (item) {
                // Mostrar mensaje y aplicar el efecto de desvanecimiento
                notificationElement.textContent = `Paciente ${motivo} y eliminado de la lista de espera`;
                notificationElement.style.display = 'block';
                item.classList.add('fade-out');
                setTimeout(() => {
                    item.remove();
                    notificationElement.style.display = 'none';
                }, 1000); // Tiempo igual al de la animación
            }
        });
    };

    // Función para consultar pacientes por consultorio
    const consultarPacientes = () => {
        const nroConsultorio = consultorioSelect.value; // Obtener el número de consultorio seleccionado
        fetch(`/pacientes?nro_consultorio=${nroConsultorio}`)
            .then(response => response.json())
            .then(pacientes => {
                const lista = document.getElementById('pacientes-lista');
                lista.innerHTML = ''; // Limpiar la lista antes de agregar nuevos elementos
                pacientes.forEach(paciente => {
                    const item = document.createElement('li');
                    item.setAttribute('data-id', paciente.id);

                    // Extraer solo la hora del campo 'horario'
                    const horario = new Date(paciente.horario).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                    // Crear un contenedor para la información del paciente
                    const info = document.createElement('div');
                    info.textContent = `${paciente.nombre} ${paciente.apellido} - ${horario}`;
                    info.className = 'info'; // Añadir clase para la información

                    // Crear un contenedor para los botones
                    const btnContainer = document.createElement('div');
                    btnContainer.className = 'btn-container';

                    const botonLlamar = document.createElement('button');
                    botonLlamar.textContent = 'Llamar';
                    botonLlamar.className = 'btn btn-llamar';
                    botonLlamar.onclick = () => window.llamarPaciente(paciente.id);

                    const botonAtendido = document.createElement('button');
                    botonAtendido.textContent = 'Atendido';
                    botonAtendido.className = 'btn btn-atendido';
                    botonAtendido.onclick = () => window.marcarAtendido(paciente.id, 'ATENDIDO');

                    const botonNoAtendido = document.createElement('button');
                    botonNoAtendido.textContent = 'No Atendido';
                    botonNoAtendido.className = 'btn btn-no-atendido';
                    botonNoAtendido.onclick = () => window.marcarAtendido(paciente.id, 'NO ATENDIDO');

                    // Añadir botones al contenedor
                    btnContainer.appendChild(botonLlamar);
                    btnContainer.appendChild(botonAtendido);
                    btnContainer.appendChild(botonNoAtendido);

                    // Añadir elementos al item
                    item.appendChild(info);
                    item.appendChild(btnContainer);

                    lista.appendChild(item);
                });
            });
    };

    // Agregar evento al botón de consultar
    consultarBtn.addEventListener('click', consultarPacientes);
});