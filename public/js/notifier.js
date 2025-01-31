document.addEventListener('DOMContentLoaded', () => {
    const socket = io();
    const notificationsContainer = document.getElementById('notifications');
    const patientsList = document.getElementById('patients');
    const enableSoundButton = document.getElementById('enable-sound');

    let selectedVoice = null; // Almacena la voz seleccionada

    // Cargar voces disponibles y seleccionar Google Español
    const loadVoices = () => {
        const voices = window.speechSynthesis.getVoices();
        console.log('Voces disponibles:', voices);

        // Configura por defecto la voz Google Español (es-ES)
        selectedVoice = voices.find(voice => voice.name.includes('Google español')) || voices.find(voice => voice.lang.startsWith('es')) || voices[0];

        if (!selectedVoice) {
            console.warn('No se encontró la voz Google Español (es-ES). Se usará la primera disponible.');
        } else {
            console.log(`Voz seleccionada: ${selectedVoice.name} (${selectedVoice.lang})`);
        }
    };

    // Escuchar el evento onvoiceschanged para cargar voces
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = loadVoices;
    } else {
        loadVoices();
    }

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

        // Reproducir el nombre por el parlante con la voz seleccionada
        const utterance = new SpeechSynthesisUtterance(`${data.nombre} ${data.apellido}, diríjase al consultorio ${data.nro_consultorio}`);
        utterance.lang = 'es-ES'; // Configura el idioma a español
        if (selectedVoice) {
            utterance.voice = selectedVoice;
        }
        window.speechSynthesis.speak(utterance);

        // Limitar la cantidad de notificaciones
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

    // Habilitar el sonido (si se desea mantener esta funcionalidad)
    enableSoundButton.addEventListener('click', () => {
        const dummyUtterance = new SpeechSynthesisUtterance("Prueba de sonido habilitada");
        dummyUtterance.lang = 'es-ES';
        if (selectedVoice) {
            dummyUtterance.voice = selectedVoice;
        }
        window.speechSynthesis.speak(dummyUtterance);
    });
});