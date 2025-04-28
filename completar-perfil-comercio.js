import { verificarSesion } from './verificar-sesion.js';
verificarSesion();

import { auth, db } from './firebase-config.js';
import {
  doc,
  setDoc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  addDoc
} from 'https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/11.3.1/firebase-auth.js';

const form = document.getElementById('completar-perfil-form');
const provinciasSelect = document.getElementById('provincia');
const localidadesSelect = document.getElementById('localidad');
const rubroSelect = document.getElementById('rubro');

let localidadesGlobal = [];
let comercioExistenteId = null; // Guardar ID del comercio si existe

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
  });

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    alert('Debés iniciar sesión primero.');
    return window.location.href = 'login.html';
  }

  const tipoCuenta = localStorage.getItem('tipoCuenta');
  if (tipoCuenta !== 'comercio') {
    alert('Esta página es solo para cuentas de comercio.');
    return window.location.href = 'dashboard-usuario.html';
  }

  const usuarioDocRef = doc(db, 'usuariosComercio', user.uid);

  try {
    // Cargar datos del usuarioComercio
    const usuarioSnap = await getDoc(usuarioDocRef);
    if (usuarioSnap.exists()) {
      const data = usuarioSnap.data();
      document.getElementById('nombre').value = data.nombre || '';
      document.getElementById('apellido').value = data.apellido || '';
      document.getElementById('telefono').value = data.telefono || '';
      document.getElementById('edad').value = data.edad || '';
    }

    // Cargar el primer comercio asociado
    const q = query(collection(db, 'comercios'), where('uidDueno', '==', user.uid));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const comercio = querySnapshot.docs[0].data();
      comercioExistenteId = querySnapshot.docs[0].id;
      document.getElementById('nombre-comercio').value = comercio.nombreComercio || '';
      document.getElementById('direccion-comercio').value = comercio.direccion || '';
      document.getElementById('redes').value = comercio.redes || '';
      rubroSelect.value = comercio.rubro || '';

      if (comercio.provincia) {
        provinciasSelect.value = comercio.provincia;
        provinciasSelect.dispatchEvent(new Event('change'));
        setTimeout(() => {
          localidadesSelect.value = comercio.localidad || '';
        }, 500);
      }
    }

  } catch (err) {
    console.error('Error al obtener datos del perfil:', err);
    alert('Error al cargar el perfil.');
  }

  // Guardar
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const datosUsuario = {
      nombre: document.getElementById('nombre').value.trim(),
      apellido: document.getElementById('apellido').value.trim(),
      telefono: document.getElementById('telefono').value.trim(),
      edad: document.getElementById('edad').value,
      completadoPerfil: true,
    };

    const datosComercio = {
      uidDueno: user.uid,
      nombreComercio: document.getElementById('nombre-comercio').value.trim(),
      direccion: document.getElementById('direccion-comercio').value.trim(),
      provincia: provinciasSelect.value,
      localidad: localidadesSelect.value,
      rubro: rubroSelect.value,
      redes: document.getElementById('redes').value.trim(),
      creadoEn: new Date().toISOString()
    };

    try {
      // Guardar datos personales
      await setDoc(usuarioDocRef, datosUsuario, { merge: true });

      if (comercioExistenteId) {
        // Actualizar comercio existente
        await setDoc(doc(db, 'comercios', comercioExistenteId), datosComercio, { merge: true });
      } else {
        // Crear nuevo comercio
        await addDoc(collection(db, 'comercios'), datosComercio);
      }

      alert('Perfil y comercio guardados correctamente.');
      window.location.href = 'dashboard-comercio.html';
    } catch (err) {
      console.error('Error al guardar perfil o comercio:', err);
      alert('Error al guardar. Intentá de nuevo.');
    }
  });
});
