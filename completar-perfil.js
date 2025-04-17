import { auth, db } from './firebase-config.js';
import {
  doc,
  setDoc,
  getDoc
} from 'https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/11.3.1/firebase-auth.js';

const form = document.getElementById('perfil-form');
const provinciasSelect = document.getElementById('provincia');
const localidadesSelect = document.getElementById('localidad');

// Obtener tipo de cuenta desde localStorage (definido en registro)
const tipoCuenta = localStorage.getItem('tipoCuenta');
const coleccion = tipoCuenta === 'tipo-comercio' ? 'comercios' : 'usuarios';
const dashboardDestino = tipoCuenta === 'tipo-comercio' ? 'dashboard-comercio.html' : 'dashboard-usuario.html';

// Cargar localidades desde archivo JSON
fetch('localidades.json')
  .then(res => res.json())
  .then(data => {
    const localidades = data.localidades_censales;

    // Extraer provincias únicas
    const provincias = [...new Set(localidades.map(loc => loc.provincia.nombre))];
    provincias.sort().forEach(prov => {
      const option = document.createElement('option');
      option.value = prov;
      option.textContent = prov;
      provinciasSelect.appendChild(option);
    });

    // Filtrar localidades por provincia
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
    // Precarga el email si existe
    const emailField = document.getElementById('email');
    if (emailField) {
      emailField.value = user.email || '';
    }

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const nombre = document.getElementById('nombre').value.trim();
      const telefono = document.getElementById('telefono').value.trim();
      const edad = document.getElementById('edad').value.trim();
      const provincia = provinciasSelect.value.trim();
      const localidad = localidadesSelect.value.trim();
      const redes = document.getElementById('redes')?.value.trim() || '';
      const formacion = document.getElementById('formacion')?.value.trim() || '';
      const trabajo = document.getElementById('trabajo')?.value.trim() || '';

      if (!nombre || !telefono || !edad || !provincia || !localidad) {
        alert('Por favor, completá todos los campos obligatorios.');
        return;
      }

      try {
        const docRef = doc(db, coleccion, user.uid);
        await setDoc(docRef, {
          nombre,
          telefono,
          edad,
          provincia,
          localidad,
          redes,
          formacion,
          trabajo,
          completadoPerfil: true,
        }, { merge: true });

        alert('Perfil completado con éxito.');
        window.location.href = dashboardDestino;

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

