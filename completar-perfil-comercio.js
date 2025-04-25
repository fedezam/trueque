import { verificarSesion } from './verificar-sesion.js';
verificarSesion();

import { auth, db } from './firebase-config.js';
import {
  doc,
  setDoc,
  getDoc,
  collection,
  addDoc,
  updateDoc
} from 'https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js';

import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/11.3.1/firebase-auth.js';

const form = document.getElementById('completar-perfil-form');
const provinciasSelect = document.getElementById('provincia');
const localidadesSelect = document.getElementById('localidad');
const rubroSelect = document.getElementById('rubro'); // Obtener el nuevo select de rubros

// Cargar provincias y localidades
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

// Cargar rubros desde rubros.json (nueva lógica para tu formato)
fetch('rubros.json')
  .then(res => res.json())
  .then(data => {
    if (data && data.rubros_comerciales_principales) {
      data.rubros_comerciales_principales.sort((a, b) => a.rubro.localeCompare(b.rubro)).forEach(item => {
        const option = document.createElement('option');
        option.value = item.rubro; // Usamos el nombre del rubro como valor
        option.textContent = item.rubro;
        rubroSelect.appendChild(option);
      });
    } else {
      console.error('El archivo rubros.json no tiene la estructura esperada.');
    }
  })
  .catch(error => {
    console.error('Error al cargar los rubros:', error);
  });

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    alert('Debés iniciar sesión primero.');
    window.location.href = 'login.html';
    return;
  }

  const userDocRef = doc(db, 'comercios', user.uid);

  try {
    const docSnap = await getDoc(userDocRef);
    if (!docSnap.exists()) {
      await setDoc(userDocRef, {
        nombre: '',
        apellido: '',
        telefono: '',
        edad: '',
        creadoEn: new Date().toISOString(),
        completadoPerfil: false
      });
    }
  } catch (err) {
    console.error('Error al preparar perfil:', err);
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // DATOS PERSONALES
    const datosPersonales = {
      nombre: document.getElementById('nombre').value.trim(),
      apellido: document.getElementById('apellido').value.trim(),
      telefono: document.getElementById('telefono').value.trim(),
      edad: document.getElementById('edad').value,
      completadoPerfil: true
    };

    // DATOS DEL COMERCIO
    const nuevoComercio = {
      nombre: document.getElementById('nombre-comercio').value.trim(),
      direccion: document.getElementById('direccion-comercio').value.trim(),
      provincia: provinciasSelect.value,
      localidad: localidadesSelect.value,
      rubro: rubroSelect.value, // Obtener el valor seleccionado del select
      redes: document.getElementById('redes').value.trim(),
      creadoEn: new Date().toISOString()
    };

    try {
      // Actualiza perfil del comerciante
      await updateDoc(userDocRef, datosPersonales);

      // Guarda nuevo comercio en subcolección
      await addDoc(collection(userDocRef, 'sucursales'), nuevoComercio);

      alert('Perfil y comercio guardados correctamente.');
      window.location.href = 'dashboard-comercio.html';
    } catch (err) {
      console.error('Error al guardar datos:', err);
      alert('Hubo un error al guardar la información.');
    }
  });
});
