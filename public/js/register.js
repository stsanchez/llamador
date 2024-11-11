
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
        function actualizarConsultorio() {
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
 