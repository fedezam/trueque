// completar-perfil-comercio.js

import { verificarSesion } from './verificar-sesion.js';
import { auth, db } from './firebase-config.js';
import {
  doc,
  setDoc,
  getDoc
} from 'https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/11.3.1/firebase-auth.js';

// Referencias a elementos del formulario
const form = document.getElementById('completar-perfil-form');
const provinciasSelect = document.getElementById('provincia');
const localidadesSelect = document.getElementById('localidad');
const rubroSelect = document.getElementById('rubro');
const hijosSelect = document.getElementById('hijos');
const cantidadHijosDiv = document.getElementById('cantidad-hijos');
const cantidadHijosInput = document.getElementById('cantidad-hijos-input');

// Variables globales
let localidadesGlobal = [];

// ========== CARGAR PROVINCIAS Y LOCALIDADES ==========

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
    alert('Error al cargar información de ubicación.');
  });

// ========== CARGAR RUBROS COMERCIALES ==========

fetch('rubros.json')
  .then(res => res.json())
  .then(data => {
    rubroSelect.innerHTML = '<option value="">Seleccioná un rubro</option>';
    data.rubros_comerciales_principales.forEach(rubro => {
      const option = document.createElement('option');
      option.value = rubro.rubro;
      option.textContent = rubro.rubro;
      rubroSelect.appendChild(option);
    });
  })
  .catch(err => {
    console.error('Error al cargar rubros:', err);
    alert('Error al cargar los rubros comerciales.');
  });

// ========== MOSTRAR/OCULTAR CANTIDAD DE HIJOS ==========

hijosSelect.addEventListener('change', (e) => {
  cantidadHijosDiv.style.display = e.target.value === 'si' ? 'block' : 'none';
});

// ========== VERIFICAR SESIÓN Y CARGAR DATOS EXISTENTES ==========

verificarSesion(); // Redirige si no hay sesión válida

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    alert('Debés iniciar sesión.');
    window.location.href = 'login.html';
    return;
  }

  const docRef = doc(db, 'usuariosComercio', user.uid);

  try {
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();

      // Datos personales
      document.getElementById('nombre').value = data.nombre || '';
      document.getElementById('apellido').value = data.apellido || '';
      document.getElementById('telefono').value = data.telefono || '';
      document.getElementById('edad').value = data.edad || '';
      document.getElementById('formacion-academica').value = data.formacion || '';
      document.getElementById('trabajo').value = data.trabajo || '';
      document.getElementById('ecivil').value = data.ecivil || '';
      document.getElementById('hijos').value = data.hijos || '';

      if (data.hijos === 'si' && data.cantidadHijos) {
        cantidadHijosDiv.style.display = 'block';
        cantidadHijosInput.value = data.cantidadHijos;
      }

      // Datos comerciales
      document.getElementById('nombre-comercio').value = data.nombreComercio || '';
      document.getElementById('direccion-comercio').value = data.direccion || '';
      document.getElementById('redes').value = data.redes || '';
      document.getElementById('google-maps').value = data.googleMaps || '';
      rubroSelect.value = data.rubro || '';

      if (data.provincia) {
        provinciasSelect.value = data.provincia;
        provinciasSelect.dispatchEvent(new Event('change'));
        setTimeout(() => {
          localidadesSelect.value = data.localidad || '';
        }, 300); // Da tiempo a que se carguen las localidades
      }
    }

  } catch (err) {
    console.error('Error al cargar datos del comerciante:', err);
    alert('Error al cargar tu perfil. Intentalo más tarde.');
  }

  // ========== GUARDAR FORMULARIO ==========

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const perfilActualizado = {
      // Datos personales
      nombre: document.getElementById('nombre').value.trim(),
      apellido: document.getElementById('apellido').value.trim(),
      telefono: document.getElementById('telefono').value.trim(),
      edad: document.getElementById('edad').value,
      formacion: document.getElementById('formacion-academica').value,
      trabajo: document.getElementById('trabajo').value,
      ecivil: document.getElementById('ecivil').value,
      hijos: document.getElementById('hijos').value,
      cantidadHijos: document.getElementById('hijos').value === 'si' ? cantidadHijosInput.value : '',

      // Datos comerciales
      nombreComercio: document.getElementById('nombre-comercio').value.trim(),
      direccion: document.getElementById('direccion-comercio').value.trim(),
      provincia: provinciasSelect.value,
      localidad: localidadesSelect.value,
      rubro: rubroSelect.value,
      redes: document.getElementById('redes').value.trim(),
      googleMaps: document.getElementById('google-maps').value.trim(),

      completadoPerfil: true,
    };

    try {
      await setDoc(docRef, perfilActualizado, { merge: true });
      alert('Perfil guardado exitosamente.');
      window.location.href = 'dashboard-comercio.html';
    } catch (err) {
      console.error('Error al guardar perfil:', err);
      alert('Hubo un error guardando tu perfil.');
    }
  });
});

