import { verificarSesion } from './verificar-sesion.js';
verificarSesion();

import { auth, db } from './firebase-config.js';
import { doc, setDoc, getDoc } from 'https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/11.3.1/firebase-auth.js';

// Elementos del DOM
const form = document.getElementById('completar-perfil-form');
const provinciasSelect = document.getElementById('provincia');
const localidadesSelect = document.getElementById('localidad');
const cantidadHijosDiv = document.getElementById('cantidad-hijos');
const cantidadHijosInput = document.getElementById('cantidad-hijos-input');
const hijosSelect = document.getElementById('hijos');

// Mostrar campo de cantidad de hijos si elige "Sí"
hijosSelect.addEventListener('change', (e) => {
  const tieneHijos = e.target.value === 'si';
  cantidadHijosDiv.style.display = tieneHijos ? 'block' : 'none';
  cantidadHijosInput.required = tieneHijos;
});

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

// Verificar sesión y cargar datos existentes
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    alert('Debés iniciar sesión primero.');
    window.location.href = 'login.html';
    return;
  }

  const tipoCuenta = localStorage.getItem('tipoCuenta');
  const coleccion = tipoCuenta === 'comercio' ? 'usuariosComercio' : 'usuarios';
  const dashboardDestino = tipoCuenta === 'comercio' ? 'dashboard-comercio.html' : 'dashboard-usuario.html';
  const docRef = doc(db, coleccion, user.uid);

  try {
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      alert('Tu cuenta no está completamente registrada. Volvé a registrarte.');
      window.location.href = 'registro.html';
      return;
    }

    const data = docSnap.data();
    document.getElementById('nombre').value = data.nombre || '';
    document.getElementById('apellido').value = data.apellido || '';
    document.getElementById('telefono').value = data.telefono || '';
    document.getElementById('edad').value = data.edad || '';
    document.getElementById('formacion-academica').value = data.formacion || '';
    document.getElementById('trabajo').value = data.trabajo || '';
    document.getElementById('ecivil').value = data.ecivil || '';
    hijosSelect.value = data.hijos || '';

    if (data.hijos === 'si' && data.cantidadHijos) {
      cantidadHijosDiv.style.display = 'block';
      cantidadHijosInput.value = data.cantidadHijos;
      cantidadHijosInput.required = true;
    }

    if (data.provincia) {
      provinciasSelect.value = data.provincia;
      provinciasSelect.dispatchEvent(new Event('change'));

      setTimeout(() => {
        localidadesSelect.value = data.localidad || '';
      }, 500);
    }
  } catch (err) {
    console.error('Error al obtener datos del perfil:', err);
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
      provincia: provinciasSelect.value,
      localidad: localidadesSelect.value,
      formacion: document.getElementById('formacion-academica').value,
      trabajo: document.getElementById('trabajo').value,
      ecivil: document.getElementById('ecivil').value,
      hijos: hijosSelect.value,
      cantidadHijos: hijosSelect.value === 'si' ? cantidadHijosInput.value.trim() : '',
      completadoPerfil: true,
    };

    try {
      await setDoc(docRef, perfilActualizado, { merge: true });
      alert('✅ Perfil guardado correctamente.');
      window.location.href = dashboardDestino;
    } catch (err) {
      console.error('Error al guardar el perfil:', err);
      alert('❌ Error al guardar tu perfil. Intentalo nuevamente.');
    }
  });
});
