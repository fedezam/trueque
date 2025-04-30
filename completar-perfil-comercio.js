import { verificarSesion } from './verificar-sesion.js';
verificarSesion();

import { auth, db } from './firebase-config.js';
import {
  doc,
  getDoc,
  setDoc
} from 'https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/11.3.1/firebase-auth.js';

// Referencias a elementos del DOM
const form = document.getElementById('completar-perfil-comercio-form');
const provinciasSelect = document.getElementById('provincia');
const localidadesSelect = document.getElementById('localidad');
const hijosSelect = document.getElementById('hijos');
const cantidadHijosDiv = document.getElementById('cantidad-hijos');
const cantidadHijosInput = document.getElementById('cantidad-hijos-input');

const provComSelect = document.getElementById('provincia-comercio');
const locComSelect = document.getElementById('localidad-comercio');
const rubroSelect = document.getElementById('rubro');

const spinner = document.getElementById('spinner');
const container = document.getElementById('perfil-container');

// Mostrar u ocultar campo cantidad de hijos
hijosSelect.addEventListener('change', (e) => {
  cantidadHijosDiv.style.display = e.target.value === 'si' ? 'block' : 'none';
});

// Variables globales
let localidadesGlobal = [];

// Cargar provincias y localidades
fetch('localidades.json')
  .then(res => res.json())
  .then(data => {
    localidadesGlobal = data.localidades_censales;

    const provincias = [...new Set(localidadesGlobal.map(loc => loc.provincia.nombre))].sort();

    provincias.forEach(prov => {
      provinciasSelect.appendChild(new Option(prov, prov));
      provComSelect.appendChild(new Option(prov, prov));
    });

    provinciasSelect.addEventListener('change', () => {
      const seleccion = provinciasSelect.value;
      localidadesSelect.innerHTML = '<option value="">Seleccioná una localidad</option>';
      localidadesGlobal
        .filter(loc => loc.provincia.nombre === seleccion)
        .sort((a, b) => a.nombre.localeCompare(b.nombre))
        .forEach(loc => localidadesSelect.appendChild(new Option(loc.nombre, loc.nombre)));
    });

    provComSelect.addEventListener('change', () => {
      const seleccion = provComSelect.value;
      locComSelect.innerHTML = '<option value="">Seleccioná una localidad</option>';
      localidadesGlobal
        .filter(loc => loc.provincia.nombre === seleccion)
        .sort((a, b) => a.nombre.localeCompare(b.nombre))
        .forEach(loc => locComSelect.appendChild(new Option(loc.nombre, loc.nombre)));
    });
  })
  .catch(err => {
    console.error('❌ Error cargando localidades:', err.message);
    alert('Error al cargar provincias y localidades.');
  });

// Cargar rubros comerciales desde archivo JSON
fetch('rubros.json')
  .then(res => res.json())
  .then(data => {
    data.rubros_comerciales_principales.forEach(r => {
      rubroSelect.appendChild(new Option(r.rubro, r.rubro));
    });
  })
  .catch(err => {
    console.error('❌ Error cargando rubros:', err.message);
    alert('Error al cargar rubros.');
  });

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    alert('Debés iniciar sesión primero.');
    return window.location.href = 'login.html';
  }

  spinner.style.display = 'block';

  const uid = user.uid;
  const docUsuario = doc(db, 'usuariosComercio', uid);
  const docComercio = doc(db, 'comercios', uid);

  try {
    const [usuarioSnap, comercioSnap] = await Promise.all([
      getDoc(docUsuario),
      getDoc(docComercio)
    ]);

    if (!usuarioSnap.exists()) {
      alert('Datos personales no encontrados. Reintentá el registro.');
      return window.location.href = 'registro.html';
    }

    const d = usuarioSnap.data();
    const c = comercioSnap.exists() ? comercioSnap.data() : {};

    // Cargar datos personales
    form.nombre.value = d.nombre || '';
    form.apellido.value = d.apellido || '';
    form.email.value = d.email || '';
    form.telefono.value = d.telefono || '';
    form.nacimiento.value = d.nacimiento || '';
    form.edad.value = d.edad || '';
    form.provincia.value = d.provincia || '';
    form.formacion.value = d.formacion || '';
    form.trabajo.value = d.trabajo || '';
    form.ecivil.value = d.ecivil || '';
    form.hijos.value = d.hijos || '';
    form.direccion.value = d.direccion || '';
    form.numero.value = d.numero || '';
    form.departamento.value = d.departamento || '';

    if (d.provincia) provinciasSelect.dispatchEvent(new Event('change'));
    setTimeout(() => {
      localidadesSelect.value = d.localidad || '';
    }, 300);

    if (d.hijos === 'si') {
      cantidadHijosDiv.style.display = 'block';
      cantidadHijosInput.value = d.cantidadHijos || '1';
    }

    // Cargar datos del comercio
    form.nombreComercio.value = c.nombreComercio || '';
    form.direccionComercio.value = c.direccion || '';
    form.numeroComercio.value = c.numero || '';
    form.departamentoComercio.value = c.departamento || '';
    form.provinciaComercio.value = c.provincia || '';
    form.telefonoComercio.value = c.telefono || '';
    form.localidadComercio.value = c.localidad || '';
    form.rubro.value = c.rubro || '';
    form.web.value = c.redes?.web || '';
    form.instagram.value = c.redes?.instagram || '';
    form.facebook.value = c.redes?.facebook || '';
    form.enlaceMaps.value = c.enlaceMaps || '';

    if (c.provincia) provComSelect.dispatchEvent(new Event('change'));
    setTimeout(() => {
      locComSelect.value = c.localidad || '';
    }, 300);

    container.style.display = 'block';

  } catch (err) {
    console.error('❌ Error cargando datos:', err.message);
    alert('Error al cargar tus datos.');
  } finally {
    spinner.style.display = 'none';
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const datosPersonales = {
      nombre: form.nombre.value.trim(),
      apellido: form.apellido.value.trim(),
      email: form.email.value.trim(),
      telefono: form.telefono.value.trim(),
      nacimiento: form.nacimiento.value,
      edad: form.edad.value,
      provincia: provinciasSelect.value,
      localidad: localidadesSelect.value,
      direccion: form.direccion.value.trim(),
      numero: form.numero.value.trim(),
      departamento: form.departamento.value.trim(),
      formacion: form.formacion.value,
      trabajo: form.trabajo.value,
      ecivil: form.ecivil.value,
      hijos: form.hijos.value,
      cantidadHijos: form.hijos.value === 'si' ? cantidadHijosInput.value.trim() : '0',
      completadoPerfil: true
    };

    const datosComercio = {
      ownerUid: uid,
      nombreComercio: form.nombreComercio.value.trim(),
      direccion: form.direccionComercio.value.trim(),
      numero: form.numeroComercio.value.trim(),
      departamento: form.departamentoComercio.value.trim(),
      provincia: provComSelect.value,
      localidad: locComSelect.value,
      rubro: form.rubro.value,
      telefono: form.telefonoComercio.value.trim(),
      enlaceMaps: form.enlaceMaps.value.trim(),
      redes: {
        web: form.web.value.trim(),
        instagram: form.instagram.value.trim(),
        facebook: form.facebook.value.trim()
      },
      completadoPerfil: true
    };

    try {
      await setDoc(docUsuario, datosPersonales, { merge: true });
      await setDoc(docComercio, datosComercio, { merge: true });

      alert('Perfil completado correctamente.');
      window.location.href = 'dashboard-comercio.html';
    } catch (err) {
      console.error('❌ Error guardando perfil:', err.message);
      alert('Error al guardar tu perfil.');
    }
  });
});

