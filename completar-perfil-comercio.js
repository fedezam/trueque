import { verificarSesion } from './verificar-sesion.js';
import { auth, db } from './firebase-config.js';
import {
  doc,
  setDoc,
  getDoc
} from 'https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/11.3.1/firebase-auth.js';

// Elementos
const form = document.getElementById('completar-perfil-form');
const provinciasSelect = document.getElementById('provincia');
const localidadesSelect = document.getElementById('localidad');
const rubroSelect = document.getElementById('rubro');

// Variables Globales
let localidadesGlobal = [];

// Cargar Provincias y Localidades
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
    console.error('Error al cargar localidades:', err);
    alert('Error al cargar la información de ubicación.');
  });

// Cargar Rubros
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
    alert('Error al cargar la información de rubros.');
  });

// Verificar sesión de usuario
verificarSesion();

// Manejar el usuario logueado
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    alert('Debés iniciar sesión.');
    window.location.href = 'login.html';
    return;
  }

  const docRef = doc(db, "usuariosComercio", user.uid);

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
    console.error('Error al cargar datos:', err);
    alert('Error al cargar tus datos. Intenta nuevamente.');
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Validar que haya al menos una red social o sitio web
    const web = document.getElementById('web').value.trim();
    const instagram = document.getElementById('instagram').value.trim();
    const facebook = document.getElementById('facebook').value.trim();

    if (!web && !instagram && !facebook) {
      alert('Debés completar al menos un campo de presencia online.');
      return;
    }

    const perfilComercio = {
      nombre: document.getElementById('nombre').value.trim(),
      apellido: document.getElementById('apellido').value.trim(),
      telefono: document.getElementById('telefono').value.trim(),
      edad: document.getElementById('edad').value,
      nombreComercio: document.getElementById('nombre-comercio').value.trim(),
      direccion: document.getElementById('direccion-comercio').value.trim(),
      provincia: provinciasSelect.value,
      localidad: localidadesSelect.value,
      rubro: rubroSelect.value,
      web,
      instagram,
      facebook,
      completadoPerfil: true
    };

    try {
      await setDoc(docRef, perfilComercio, { merge: true });
      alert('Perfil del comercio guardado exitosamente.');
      window.location.href = 'dashboard-comercio.html';
    } catch (err) {
      console.error('Error al guardar el perfil:', err);
      alert('Error al guardar el perfil. Intenta de nuevo.');
    }
  });
});

