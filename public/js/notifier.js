document.addEventListener('DOMContentLoaded', () => {
    const socket = io();
    const notificationsContainer = document.getElementById('notifications');
    const patientsList = document.getElementById('patients');
    const notificationSound = document.getElementById('notification-sound');
    const enableSoundButton = document.getElementById('enable-sound');

    // Manejar la lista de pacientes inicial
    fetch('/pacientes')
        .then(response => response.json())
        .then(data => {
            data.forEach(patient => {
                const li = document.createElement('li');
                li.setAttribute('data-id', patient.id);
                li.textContent = `${patient.nombre} ${patient.apellido} - ${patient.especialidad}`;
                patientsList.appendChild(li);
            });
        });

    // Escuchar el evento para nuevo paciente
    socket.on('nuevo_paciente', (data) => {
        const li = document.createElement('li');
        li.setAttribute('data-id', data.id);
        li.textContent = `${data.nombre} ${data.apellido} - ${data.especialidad}`;
        patientsList.appendChild(li);
    });

    // Manejar la notificación de llamada
    socket.on('llamada', (data) => {
        const notificationElement = document.createElement('div');
        notificationElement.classList.add('notification');
        notificationElement.innerHTML = `${data.nombre} ${data.apellido}<br>${data.especialidad}: CONSULTORIO ${data.nro_consultorio}`;
        notificationsContainer.prepend(notificationElement);
        notificationElement.style.display = 'block';

        if (notificationSound.dataset.enabled === 'true') {
            notificationSound.play().catch(error => {
                console.error('Error al reproducir el sonido:', error);
            });
        }

        if (notificationsContainer.children.length > 5) {
            notificationsContainer.removeChild(notificationsContainer.lastChild);
        }

        // Eliminar paciente de la lista de espera
        const patientItems = patientsList.querySelectorAll('li');
        patientItems.forEach(item => {
            if (item.textContent.includes(`${data.nombre} ${data.apellido}`)) {
                patientsList.removeChild(item);
            }
        });
    });

    // Habilitar el sonido
    enableSoundButton.addEventListener('click', () => {
        notificationSound.play().then(() => {
            notificationSound.dataset.enabled = 'true';
        }).catch(error => {
            console.error('Error al habilitar el sonido:', error);
        });
    });
});
