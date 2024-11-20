
        // Función para buscar al paciente por DNI y autocompletar nombre y apellido
        async function buscarPaciente() {
            const dni = document.getElementById("dni").value;

            if (dni) { // Solo busca si el campo DNI tiene algún valor
                try {
                    const response = await fetch(`/paciente?dni=${dni}`);
                    const data = await response.json();
                    if (data.success) {
                        // Autocompletar los campos de nombre y apellido
                        document.getElementById("nombre").value = data.nombre;
                        document.getElementById("apellido").value = data.apellido;
                    } else {
                        // Limpia los campos si no hay coincidencias
                        document.getElementById("nombre").value = '';
                        document.getElementById("apellido").value = '';
                        alert('Paciente no encontrado');
                    }
                } catch (error) {
                    console.error('Error al buscar paciente:', error);
                }
            }
        }

        // Función para actualizar el número de consultorio según la especialidad
        /*function actualizarConsultorio() {
            const especialidad = document.getElementById("especialidad").value;
            const consultorioInput = document.getElementById("nro_consultorio");
            
            // Asignar el número de consultorio según la especialidad seleccionada
            switch (especialidad) {
                case "Traumatologia":
                    consultorioInput.value = 1;
                    break;
                case "Clinico":
                    consultorioInput.value = 2;
                    break;
                case "Ginecologia":
                    consultorioInput.value = 3;
                    break;
                case "Guardia espontanea":
                    consultorioInput.value = 4;
                    break;
                default:
                    consultorioInput.value = ""; // Limpia el campo si no hay selección
            }
        }
 */
// Función para establecer la fecha actual como valor predeterminado en el campo datetime-local
document.addEventListener("DOMContentLoaded", () => {
    const horarioInput = document.getElementById("horario");

    // Obtener la fecha y hora actual
    const ahora = new Date();
    const anio = ahora.getFullYear();
    const mes = String(ahora.getMonth() + 1).padStart(2, '0'); // Los meses son 0-indexados
    const dia = String(ahora.getDate()).padStart(2, '0');
    const horaPredeterminada = "09:00"; // Hora predeterminada para el turno

    // Establecer el valor en formato "YYYY-MM-DDTHH:MM"
    const valorPorDefecto = `${anio}-${mes}-${dia}T${horaPredeterminada}`;
    horarioInput.value = valorPorDefecto;
});

function mostrarMensajeExito() {
    alert("Paciente cargado con éxito");
    return true; // Permite que el formulario se envíe
}
