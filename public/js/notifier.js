document.addEventListener('DOMContentLoaded', () => {
    const socket = io();
    const notificationsContainer = document.getElementById('notification-list');
    const videoPlayer = document.getElementById('video-player');
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
    const cmValueElement = document.getElementById('cm-value');

    // Obtener y mostrar CM_VALUE
    fetch('/api/cm_value')
    .then(response => response.json())
    .then(data => {
        cmValueElement.textContent = "CENTRO MÉDICO " + data.cmValue; // Concatenar la frase
    })
    .catch(error => {
        console.error('Error al obtener CM_VALUE:', error);
        cmValueElement.textContent = 'CENTRO MÉDICO Valor no disponible'; // Mensaje con la frase
    });
    // Cargar el video
    videoPlayer.src = 'Cápsula 1 - Sabías que_V5.mp4'; // Asegúrate de que la ruta sea correcta
    videoPlayer.autoplay = true; // Reproducción automática
    videoPlayer.muted = true; // Video sin sonido (puedes cambiarlo a false si quieres sonido)
    videoPlayer.loop = true; // Video en bucle

    // Escuchar el evento para nuevo paciente (si lo necesitas)
    socket.on('nuevo_paciente', (data) => {
        // Aquí puedes agregar código para manejar la llegada de un nuevo paciente,
        // por ejemplo, podrías mostrar una notificación o actualizar alguna información en la página.
        console.log('Nuevo paciente:', data);
    });

    // Manejar la notificación de llamada
    socket.on('llamada', (data) => {
        const notificationElement = document.createElement('li');
        notificationElement.classList.add('notification');
        notificationElement.innerHTML = `${data.nombre} ${data.apellido}<br>${data.especialidad}: CONSULTORIO ${data.nro_consultorio}`;
        notificationsContainer.appendChild(notificationElement);

        // Reproducir el nombre por el parlante con la voz seleccionada
        const utterance = new SpeechSynthesisUtterance(`${data.nombre} ${data.apellido}, diríjase al consultorio ${data.nro_consultorio}`);
        utterance.lang = 'es-ES';
        if (selectedVoice) {
            utterance.voice = selectedVoice;
        }
        window.speechSynthesis.speak(utterance);

        // Limitar la cantidad de notificaciones (opcional)
        if (notificationsContainer.children.length > 5) {
            notificationsContainer.removeChild(notificationsContainer.firstChild);
        }
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