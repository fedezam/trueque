
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
const hijosSelect = document.getElementById('hijos');
const cantidadHijosDiv = document.getElementById('cantidad-hijos');
const cantidadHijosInput = document.getElementById('cantidad-hijos-input');

// Mostrar campo "cantidad de hijos" si corresponde
hijosSelect.addEventListener('change', (e) => {
  cantidadHijosDiv.style.display = e.target.value === 'si' ? 'block' : 'none';
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
    alert('No se pudieron cargar las provincias y localidades.');
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
    alert('No se pudieron cargar los rubros.');
  });

// Verificar sesión y cargar datos
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    alert('Debés iniciar sesión primero.');
    window.location.href = 'login.html';
    return;
  }

  const tipoCuenta = localStorage.getItem('tipoCuenta');
  if (tipoCuenta !== 'comercio') {
    alert('Esta página es solo para cuentas de comercio.');
    return window.location.href = 'dashboard-usuario.html';
  }

  const docRef = doc(db, 'usuariosComercio', user.uid);
  const comercioRef = doc(db, 'comercios', user.uid);

  try {
    const docSnap = await getDoc(docRef);
    const comercioSnap = await getDoc(comercioRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      document.getElementById('nombre').value = data.nombre || '';
      document.getElementById('apellido').value = data.apellido || '';
      document.getElementById('telefono').value = data.telefono || '';
      document.getElementById('edad').value = data.edad || '';
      document.getElementById('formacion-academica').value = data.formacion || '';
      document.getElementById('trabajo').value = data.trabajo || '';
      document.getElementById('ecivil').value = data.ecivil || '';
      hijosSelect.value = data.hijos || '';
      document.getElementById('direccion').value = data.direccion || '';
      document.getElementById('numero').value = data.numero || '';
      document.getElementById('departamento').value = data.departamento || '';

      if (data.hijos === 'si' && data.cantidadHijos) {
        cantidadHijosDiv.style.display = 'block';
        cantidadHijosInput.value = data.cantidadHijos;
      }

      if (data.provincia) {
        provinciasSelect.value = data.provincia;
        provinciasSelect.dispatchEvent(new Event('change'));
        setTimeout(() => {
          localidadesSelect.value = data.localidad || '';
        }, 500);
      }
    }

    if (comercioSnap.exists()) {
      const cData = comercioSnap.data();
      document.getElementById('nombre-comercio').value = cData.nombreComercio || '';
      document.getElementById('direccion-comercio').value = cData.direccionComercio || '';
      document.getElementById('provincia-comercio').value = cData.provincia || '';
      document.getElementById('localidad-comercio').value = cData.localidad || '';
      rubroSelect.value = cData.rubro || '';
      document.getElementById('web').value = cData.web || '';
      document.getElementById('instagram').value = cData.instagram || '';
      document.getElementById('facebook').value = cData.facebook || '';
      document.getElementById('maps').value = cData.maps || '';
    }
  } catch (err) {
    console.error('Error al obtener datos del perfil del comercio:', err);
    alert('Error al cargar tu perfil. Intentá nuevamente.');
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Validaciones mínimas
    const formacion = document.getElementById('formacion-academica').value;
    const trabajo = document.getElementById('trabajo').value;
    const web = document.getElementById('web').value.trim();
    const instagram = document.getElementById('instagram').value.trim();
    const facebook = document.getElementById('facebook').value.trim();

    if (!formacion || !trabajo) {
      return alert('Completá formación académica y situación laboral.');
    }

    if (!web && !instagram && !facebook) {
      return alert('Debés completar al menos una red social o página web del comercio.');
    }

    try {
      const perfilUsuario = {
        nombre: document.getElementById('nombre').value.trim(),
        apellido: document.getElementById('apellido').value.trim(),
        telefono: document.getElementById('telefono').value.trim(),
        edad: document.getElementById('edad').value,
        provincia: provinciasSelect.value,
        localidad: localidadesSelect.value,
        formacion,
        trabajo,
        ecivil: document.getElementById('ecivil').value,
        hijos: hijosSelect.value,
        cantidadHijos: hijosSelect.value === 'si' ? cantidadHijosInput.value : '',
        direccion: document.getElementById('direccion').value.trim(),
        numero: document.getElementById('numero').value.trim(),
        departamento: document.getElementById('departamento').value.trim(),
        completadoPerfil: true
      };

      const perfilComercio = {
        ownerUid: auth.currentUser.uid,
        nombreComercio: document.getElementById('nombre-comercio').value.trim(),
        direccionComercio: document.getElementById('direccion-comercio').value.trim(),
        provincia: document.getElementById('provincia-comercio').value,
        localidad: document.getElementById('localidad-comercio').value,
        rubro: rubroSelect.value,
        web,
        instagram,
        facebook,
        maps: document.getElementById('maps').value.trim(),
        creadoEn: new Date().toISOString(),
        completadoPerfil: true
      };

      await setDoc(doc(db, 'usuariosComercio', auth.currentUser.uid), perfilUsuario, { merge: true });
      await setDoc(doc(db, 'comercios', auth.currentUser.uid), perfilComercio, { merge: true });

      alert('Perfil guardado correctamente.');
      window.location.href = 'dashboard-comercio.html';
    } catch (err) {
      console.error('Error al guardar el perfil:', err);
      alert('Error al guardar los datos. Intentá nuevamente.');
    }
  });
});
