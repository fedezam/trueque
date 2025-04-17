import { auth, db } from './firebase-config.js';
import { doc, setDoc } from 'https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/11.3.1/firebase-auth.js';

const provinciasSelect = document.getElementById('provincia');
const localidadesSelect = document.getElementById('localidad');

// Cargar provincias y localidades desde JSON
fetch('localidades.json')
  .then(res => res.json())
  .then(data => {
    const localidades = data.localidades_censales;

    const provincias = [...new Set(localidades.map(loc => loc.provincia.nombre))];
    provincias.sort().forEach(prov => {
      const option = document.createElement('option');
      option.value = prov;
      option.textContent = prov;
      provinciasSelect.appendChild(option);
    });

    provinciasSelect.addEventListener('change', () => {
      const provinciaSeleccionada = provinciasSelect.value;
      localidadesSelect.innerHTML = '<option value="">Seleccioná una localidad</option>';

      localidades
        .filter(loc => loc.provincia.nombre === provinciaSeleccionada)
        .sort((a, b) => a.nombre.localeCompare(b.nombre))
        .forEach(loc => {
          const option = document.createElement('option');
          option.value = loc.nombre;
          option.textContent = loc.nombre;
          localidadesSelect.appendChild(option);
        });
    });
  });

onAuthStateChanged(auth, (user) => {
  if (user) {
    const form = document.getElementById('completar-perfil-form');

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const nombre = document.getElementById('nombre').value.trim();
      const apellido = document.getElementById('apellido').value.trim();
      const telefono = document.getElementById('telefono').value.trim();
      const edad = document.getElementById('edad').value.trim();
      const provincia = provinciasSelect.value.trim();
      const localidad = localidadesSelect.value.trim();
      const formacion = document.getElementById('formacion-academica').value.trim();
      const trabajo = document.getElementById('trabajo').value.trim();
      const estadoCivil = document.getElementById('ecivil').value.trim();
      const hijos = document.getElementById('hijos').value.trim();

      if (!nombre || !apellido || !telefono || !edad || !provincia || !localidad || !estadoCivil || !hijos) {
        alert('Por favor, completá todos los campos obligatorios.');
        return;
      }

      try {
        const docRef = doc(db, 'usuarios', user.uid);
        await setDoc(docRef, {
          nombre,
          apellido,
          telefono,
          edad,
          provincia,
          localidad,
          formacion,
          trabajo,
          estadoCivil,
          hijos,
          completadoPerfil: true,
        }, { merge: true });

        alert('Perfil guardado con éxito.');
        window.location.href = 'dashboard-usuario.html';
      } catch (error) {
        console.error('Error al guardar perfil:', error);
        alert('Ocurrió un error al guardar tu perfil.');
      }
    });
  } else {
    alert('Debés iniciar sesión primero.');
    window.location.href = 'login.html';
  }
});

