// completar-perfil-comercio.js
import { verificarSesion } from './verificar-sesion.js';
verificarSesion();

import { auth, db } from './firebase-config.js';
import {
  doc,
  setDoc,
  getDoc
} from 'https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/11.3.1/firebase-auth.js';

// Elementos del formulario
const form = document.getElementById('completar-perfil-form');
const provinciasSelect = document.getElementById('provincia');
const localidadesSelect = document.getElementById('localidad');
const rubroSelect = document.getElementById('rubro');
const websiteInput = document.getElementById('web-comercio');
const instagramInput = document.getElementById('instagram');
const facebookInput = document.getElementById('facebook');

let localidadesGlobal = [];

// Cargar provincias y localidades desde archivo JSON
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
    alert('No se pudieron cargar las provincias y localidades.');
  });

// Cargar rubros desde archivo JSON
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
    alert('No se pudieron cargar los rubros.');
  });

// Verificar sesión y cargar datos si existen
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    alert('Debés iniciar sesión primero.');
    window.location.href = 'login.html';
    return;
  }

  const tipoCuenta = localStorage.getItem('tipoCuenta');
  if (tipoCuenta !== 'comercio') {
    alert('Esta página es solo para comerciantes.');
    return window.location.href = 'dashboard-usuario.html';
  }

  const docRef = doc(db, 'usuariosComercio', user.uid); // CORRECTO: ahora buscamos en usuariosComercio

  try {
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      console.log('Documento de comerciante no encontrado, completando perfil.');
      // No existe → completar como nuevo (sin error)
    } else {
      const data = docSnap.data();
      document.getElementById('nombre').value = data.nombre || '';
      document.getElementById('apellido').value = data.apellido || '';
      document.getElementById('telefono').value = data.telefono || '';
      document.getElementById('edad').value = data.edad || '';

      document.getElementById('nombre-comercio').value = data.nombreComercio || '';
      document.getElementById('direccion-comercio').value = data.direccionComercio || '';
      websiteInput.value = data.webComercio || '';
      instagramInput.value = data.instagram || '';
      facebookInput.value = data.facebook || '';
      rubroSelect.value = data.rubro || '';

      if (data.provincia) {
        provinciasSelect.value = data.provincia;
        provinciasSelect.dispatchEvent(new Event('change'));

        setTimeout(() => {
          localidadesSelect.value = data.localidad || '';
        }, 500);
      }
    }
  } catch (err) {
    console.error('Error al cargar datos del comerciante:', err);
    alert('Error cargando tu perfil. Por favor, intenta más tarde.');
  }

  // Guardar perfil al enviar formulario
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Validar que al menos uno de los tres campos de redes esté lleno
    if (!websiteInput.value.trim() && !instagramInput.value.trim() && !facebookInput.value.trim()) {
      alert('Debés completar al menos uno: tu sitio web, Instagram o Facebook.');
      return;
    }

    const perfilActualizado = {
      nombre: document.getElementById('nombre').value.trim(),
      apellido: document.getElementById('apellido').value.trim(),
      telefono: document.getElementById('telefono').value.trim(),
      edad: document.getElementById('edad').value.trim(),
      nombreComercio: document.getElementById('nombre-comercio').value.trim(),
      direccionComercio: document.getElementById('direccion-comercio').value.trim(),
      provincia: provinciasSelect.value,
      localidad: localidadesSelect.value,
      rubro: rubroSelect.value,
      webComercio: websiteInput.value.trim(),
      instagram: instagramInput.value.trim(),
      facebook: facebookInput.value.trim(),
      completadoPerfil: true
    };

    try {
      await setDoc(docRef, perfilActualizado, { merge: true });
      alert('✅ Perfil del comerciante actualizado correctamente.');
      window.location.href = 'dashboard-comercio.html';
    } catch (err) {
      console.error('Error al guardar perfil:', err);
      alert('❌ Error al guardar tu perfil. Intenta de nuevo.');
    }
  });
});


