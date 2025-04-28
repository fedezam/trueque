import { verificarSesion } from './verificar-sesion.js';
verificarSesion();

import { auth, db } from './firebase-config.js';
import {
  doc,
  setDoc,
  getDoc,
  addDoc,
  collection
} from 'https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js';

import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/11.3.1/firebase-auth.js';

const form = document.getElementById('completar-perfil-form');
const provinciasSelect = document.getElementById('provincia');
const localidadesSelect = document.getElementById('localidad');
const rubroSelect = document.getElementById('rubro');

// Cargar provincias y localidades
let localidadesGlobal = [];

fetch('localidades.json')
  .then(res => res.json())
  .then(data => {
    localidadesGlobal = data.localidades_censales;
    const provincias = [...new Set(localidadesGlobal.map(loc => loc.provincia.nombre))];
    provincias.sort().forEach(prov => {
      const option = document.createElement('option');
      option.value = prov;
      option.textContent = prov;
      provinciasSelect.appendChild(option);
    });

    provinciasSelect.addEventListener('change', () => {
      const seleccion = provinciasSelect.value;
      localidadesSelect.innerHTML = '<option value="">Seleccioná una localidad</option>';
      localidadesGlobal
        .filter(loc => loc.provincia.nombre === seleccion)
        .sort((a, b) => a.nombre.localeCompare(b.nombre))
        .forEach(loc => {
          const option = document.createElement('option');
          option.value = loc.nombre;
          option.textContent = loc.nombre;
          localidadesSelect.appendChild(option);
        });
    });
  })
  .catch(err => {
    console.error('Error al cargar provincias y localidades:', err);
    alert('Error al cargar la información de ubicación.');
  });

// Cargar rubros
fetch('rubros.json')
  .then(res => res.json())
  .then(data => {
    data.rubros_comerciales_principales.forEach(rubro => {
      const option = document.createElement('option');
      option.value = rubro.rubro;
      option.textContent = rubro.rubro;
      rubroSelect.appendChild(option);
    });
  })
  .catch(err => {
    console.error('Error al cargar rubros:', err);
    alert('Error al cargar los rubros.');
  });

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    alert('Debés iniciar sesión.');
    return window.location.href = 'login.html';
  }

  const uid = user.uid;
  const usuarioRef = doc(db, 'usuariosComercio', uid);

  try {
    const snap = await getDoc(usuarioRef);
    if (snap.exists()) {
      const data = snap.data();
      document.getElementById('nombre').value = data.nombre || '';
      document.getElementById('apellido').value = data.apellido || '';
      document.getElementById('telefono').value = data.telefono || '';
      document.getElementById('edad').value = data.edad || '';
    }
  } catch (err) {
    console.error('Error al cargar datos del comerciante:', err);
    alert('Error al cargar el perfil.');
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Datos personales
    const datosUsuario = {
      nombre: document.getElementById('nombre').value.trim(),
      apellido: document.getElementById('apellido').value.trim(),
      telefono: document.getElementById('telefono').value.trim(),
      edad: document.getElementById('edad').value,
      completadoPerfil: true
    };

    // Datos del comercio
    const datosComercio = {
      nombreComercio: document.getElementById('nombre-comercio').value.trim(),
      direccion: document.getElementById('direccion-comercio').value.trim(),
      provincia: provinciasSelect.value,
      localidad: localidadesSelect.value,
      rubro: rubroSelect.value,
      redes: document.getElementById('redes').value.trim(),
      propietarioUid: uid,
      creadoEn: new Date().toISOString(),
      tasks: []
    };

    try {
      await setDoc(usuarioRef, datosUsuario, { merge: true });
      await addDoc(collection(db, 'comercios'), datosComercio);

      alert('Perfil y comercio guardados correctamente.');
      window.location.href = 'dashboard-comercio.html';
    } catch (err) {
      console.error('Error al guardar:', err);
      alert('Ocurrió un error al guardar el perfil.');
    }
  });
});
