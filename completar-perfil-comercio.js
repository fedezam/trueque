import { verificarSesion } from './verificar-sesion.js';
verificarSesion();

import { auth, db } from './firebase-config.js';
import { doc, setDoc, getDoc } from 'https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/11.3.1/firebase-auth.js';

// Elementos del DOM
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
    console.error('Error cargando provincias y localidades:', err);
    alert('❌ No se pudieron cargar las provincias y localidades.');
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
    console.error('Error cargando rubros:', err);
    alert('❌ No se pudieron cargar los rubros.');
  });

// Verificar sesión y cargar datos existentes
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    alert('Debés iniciar sesión primero.');
    window.location.href = 'login.html';
    return;
  }

  const docRef = doc(db, 'usuariosComercio', user.uid);
  const dashboardDestino = 'dashboard-comercio.html';

  try {
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();

      // Cargar datos personales
      document.getElementById('nombre').value = data.nombre || '';
      document.getElementById('apellido').value = data.apellido || '';
      document.getElementById('telefono').value = data.telefono || '';
      document.getElementById('edad').value = data.edad || '';

      // Cargar datos del comercio
      document.getElementById('nombre-comercio').value = data.nombreComercio || '';
      document.getElementById('direccion-comercio').value = data.direccion || '';
      rubroSelect.value = data.rubro || '';
      document.getElementById('web').value = data.web || '';
      document.getElementById('instagram').value = data.instagram || '';
      document.getElementById('facebook').value = data.facebook || '';

      if (data.provincia) {
        provinciasSelect.value = data.provincia;
        provinciasSelect.dispatchEvent(new Event('change'));

        setTimeout(() => {
          localidadesSelect.value = data.localidad || '';
        }, 500);
      }
    }
  } catch (err) {
    console.error('Error cargando datos del comercio:', err);
    alert('❌ Error al cargar tu perfil.');
  }

  // Guardar perfil actualizado
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const perfilActualizado = {
      nombre: document.getElementById('nombre').value.trim(),
      apellido: document.getElementById('apellido').value.trim(),
      telefono: document.getElementById('telefono').value.trim(),
      edad: document.getElementById('edad').value,
      nombreComercio: document.getElementById('nombre-comercio').value.trim(),
      direccion: document.getElementById('direccion-comercio').value.trim(),
      provincia: provinciasSelect.value,
      localidad: localidadesSelect.value,
      rubro: rubroSelect.value,
      web: document.getElementById('web').value.trim(),
      instagram: document.getElementById('instagram').value.trim(),
      facebook: document.getElementById('facebook').value.trim(),
      completadoPerfil: true
    };

    try {
      await setDoc(docRef, perfilActualizado, { merge: true });
      alert('✅ Perfil del comercio guardado correctamente.');
      window.location.href = dashboardDestino;
    } catch (err) {
      console.error('Error guardando el perfil del comercio:', err);
      alert('❌ Error al guardar tu perfil. Intentalo nuevamente.');
    }
  });
});

