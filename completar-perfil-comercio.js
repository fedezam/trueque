import { verificarSesion } from './verificar-sesion.js';
verificarSesion();

import { auth, db } from './firebase-config.js';
import {
  doc,
  setDoc,
  getDoc
} from 'https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/11.3.1/firebase-auth.js';

const form = document.getElementById('completar-perfil-form');
const provinciasSelect = document.getElementById('provincia');
const localidadesSelect = document.getElementById('localidad');
const rubroSelect = document.getElementById('rubro');

let localidadesGlobal = [];

const mostrarErrorCampo = (inputId, mensaje) => {
  let errorSpan = document.querySelector(`#${inputId}-error`);
  if (!errorSpan) {
    errorSpan = document.createElement('span');
    errorSpan.id = `${inputId}-error`;
    errorSpan.className = 'error-msg';
    document.getElementById(inputId).after(errorSpan);
  }
  errorSpan.textContent = mensaje;
};

const limpiarErrores = () => {
  document.querySelectorAll('.error-msg').forEach(el => el.remove());
};

// Cargar provincias y localidades
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
    console.error('Error cargando localidades:', err);
    alert('Error cargando provincias y localidades.');
  });

// Cargar rubros comerciales
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
    alert('Error cargando rubros.');
  });

// Lógica de sesión
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    alert('Debés iniciar sesión primero.');
    window.location.href = 'login.html';
    return;
  }

  const tipoCuenta = localStorage.getItem('tipoCuenta');
  if (tipoCuenta !== 'comercio') {
    alert('Esta página es solo para comercios.');
    window.location.href = 'dashboard-usuario.html';
    return;
  }

  const docRef = doc(db, 'usuariosComercio', user.uid);

  try {
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      document.getElementById('nombre').value = data.nombre || '';
      document.getElementById('apellido').value = data.apellido || '';
      document.getElementById('telefono').value = data.telefono || '';
      document.getElementById('edad').value = data.edad || '';
    }
  } catch (err) {
    console.error('Error obteniendo datos del usuario comercio:', err);
    alert('Error cargando tus datos. Intentalo más tarde.');
  }
});

// Guardar perfil
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  limpiarErrores();

  const campos = [
    { id: 'nombre', obligatorio: true },
    { id: 'apellido', obligatorio: true },
    { id: 'telefono', obligatorio: true },
    { id: 'edad', obligatorio: true },
    { id: 'nombre-comercio', obligatorio: true },
    { id: 'direccion-comercio', obligatorio: true },
    { id: 'provincia', obligatorio: true },
    { id: 'localidad', obligatorio: true },
    { id: 'rubro', obligatorio: true }
  ];

  let hayErrores = false;

  campos.forEach(({ id, obligatorio }) => {
    const valor = document.getElementById(id)?.value.trim();
    if (obligatorio && (!valor || valor === '')) {
      mostrarErrorCampo(id, 'Este campo es obligatorio.');
      hayErrores = true;
    }
  });

  if (hayErrores) {
    window.scrollTo(0, 0);
    return;
  }

  const perfilActualizado = {
    ownerUid: auth.currentUser.uid,
    nombre: document.getElementById('nombre').value.trim(),
    apellido: document.getElementById('apellido').value.trim(),
    telefono: document.getElementById('telefono').value.trim(),
    edad: document.getElementById('edad').value,
    nombreComercio: document.getElementById('nombre-comercio').value.trim(),
    direccion: document.getElementById('direccion-comercio').value.trim(),
    provincia: provinciasSelect.value,
    localidad: localidadesSelect.value,
    rubro: rubroSelect.value,
    redes: document.getElementById('redes')?.value.trim() || '',
    completadoPerfil: true
  };

  try {
    const docRef = doc(db, 'usuariosComercio', auth.currentUser.uid);
    await setDoc(docRef, perfilActualizado, { merge: true });
    alert('✅ Perfil del comercio guardado correctamente.');
    window.location.href = 'dashboard-comercio.html';
  } catch (err) {
    console.error('Error al guardar perfil comercio:', err);
    alert('❌ Error al guardar. Verificá tu conexión.');
  }
});

