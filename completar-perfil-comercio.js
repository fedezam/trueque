// Importar módulos Firebase
import { verificarSesion } from './verificar-sesion.js';
import { auth, db } from './firebase-config.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/11.3.1/firebase-auth.js';
import { doc, setDoc, getDoc } from 'https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js';

// Verificar sesión al cargar
verificarSesion();

// Variables DOM
const form = document.getElementById('completar-perfil-form');
const provinciasSelect = document.getElementById('provincia');
const localidadesSelect = document.getElementById('localidad');
const rubroSelect = document.getElementById('rubro');

// Cargar datos de provincias y localidades
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
    console.error('Error cargando localidades:', err);
    alert('Error al cargar provincias y localidades.');
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
    alert('Error al cargar rubros de comercio.');
  });

// Detectar usuario logueado
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    alert('Debés iniciar sesión.');
    return window.location.href = 'login.html';
  }

  const tipoCuenta = localStorage.getItem('tipoCuenta');
  if (tipoCuenta !== 'comercio') {
    alert('Esta página es solo para comerciantes.');
    return window.location.href = 'dashboard-usuario.html';
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
      document.getElementById('nombre-comercio').value = data.nombreComercio || '';
      document.getElementById('direccion-comercio').value = data.direccionComercio || '';
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
      if (data.rubro) {
        rubroSelect.value = data.rubro;
      }
    }
  } catch (err) {
    console.error('Error obteniendo datos de perfil:', err);
    alert('Error al cargar tu perfil de comercio.');
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const perfilActualizado = {
      nombre: document.getElementById('nombre').value.trim(),
      apellido: document.getElementById('apellido').value.trim(),
      telefono: document.getElementById('telefono').value.trim(),
      edad: document.getElementById('edad').value,
      nombreComercio: document.getElementById('nombre-comercio').value.trim(),
      direccionComercio: document.getElementById('direccion-comercio').value.trim(),
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
      alert('Perfil del comercio actualizado.');
      window.location.href = 'dashboard-comercio.html';
    } catch (err) {
      console.error('Error actualizando perfil:', err);
      alert('Error al guardar el perfil. Intenta nuevamente.');
    }
  });
});



