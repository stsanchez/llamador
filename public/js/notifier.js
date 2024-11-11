
        document.addEventListener('DOMContentLoaded', () => {
            const socket = io();
            const notificationsContainer = document.getElementById('notifications');
            const patientsList = document.getElementById('patients');
            const notificationSound = document.getElementById('notification-sound');
            const enableSoundButton = document.getElementById('enable-sound');

            // Manejar la lista de pacientes
            fetch('/pacientes')
                .then(response => response.json())
                .then(data => {
                    data.forEach(patient => {
                        const li = document.createElement('li');
                        li.setAttribute('data-id', patient.id); // Agregar ID como atributo
                        li.textContent = `${patient.nombre} ${patient.apellido}`;
                        patientsList.appendChild(li);
                    });
                });

// Manejar la notificación de llamada
socket.on('llamada', (data) => {
    // Crear un nuevo elemento de notificación
    const notificationElement = document.createElement('div');
    notificationElement.classList.add('notification');
    notificationElement.innerHTML = `${data.nombre} ${data.apellido}<br>${data.especialidad}: Consultorio ${data.nro_consultorio}`; // Añadir especialidad con salto de línea
    notificationsContainer.prepend(notificationElement);
    notificationElement.style.display = 'block';

    // Reproducir el sonido de notificación
    if (notificationSound.dataset.enabled === 'true') {
        notificationSound.play().catch(error => {
            console.error('Error al reproducir el sonido:', error);
        });
    }

    // Limitar a un máximo de 5 notificaciones
    if (notificationsContainer.children.length > 5) {
        notificationsContainer.removeChild(notificationsContainer.lastChild);
    }

    // Eliminar al paciente de la lista de espera
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
  