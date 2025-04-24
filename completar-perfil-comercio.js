import { auth, db } from './firebase-config.js';
import {
  doc,
  collection,
  addDoc
} from 'https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/11.3.1/firebase-auth.js';

const form = document.getElementById('form-comercio');
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
      const seleccion = provinciasSelect.value;
      localidadesSelect.innerHTML = '<option value="">Seleccioná una localidad</option>';
      localidades
        .filter(loc => loc.provincia.nombre === seleccion)
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
  if (!user) {
    alert('Debés iniciar sesión primero.');
    window.location.href = 'login.html';
    return;
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const nuevoComercio = {
      nombre: document.getElementById('nombre-comercio').value.trim(),
      direccion: document.getElementById('direccion').value.trim(),
      telefono: document.getElementById('telefono').value.trim(),
      provincia: provinciasSelect.value,
      localidad: localidadesSelect.value,
      rubro: document.getElementById('rubro').value.trim(),
      redes: document.getElementById('redes').value.trim(),
      dueño: user.uid,
      creadoEn: new Date().toISOString(),
      tasks: []
    };

    try {
      await addDoc(collection(db, 'comercios'), nuevoComercio);
      alert('Comercio registrado correctamente.');
      window.location.href = 'dashboard-comercio.html';
    } catch (err) {
      console.error('Error al guardar comercio:', err);
      alert('Error al guardar el comercio.');
    }
  });
});
