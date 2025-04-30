import { verificarSesion } from './verificar-sesion.js';
verificarSesion();

import { auth, db } from './firebase-config.js';
import { doc, setDoc, getDoc } from 'https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/11.3.1/firebase-auth.js';

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('completar-perfil-form');
  const spinner = document.getElementById('spinner');
  const container = document.getElementById('perfil-container');
  const provinciasSelect = document.getElementById('provincia');
  const localidadesSelect = document.getElementById('localidad');
  const hijosSelect = document.getElementById('hijos');
  const cantidadHijosDiv = document.getElementById('cantidad-hijos');
  const cantidadHijosInput = document.getElementById('cantidad-hijos-input');

  const getInput = id => document.getElementById(id);

  const toggleCantidadHijos = (valor) => {
    cantidadHijosDiv.style.display = valor === 'si' ? 'block' : 'none';
    if (valor !== 'si') cantidadHijosInput.value = '';
  };

  if (hijosSelect) {
    hijosSelect.addEventListener('change', e => toggleCantidadHijos(e.target.value));
  }

  let localidadesGlobal = [];

  fetch('localidades.json')
    .then(res => res.json())
    .then(data => {
      localidadesGlobal = data.localidades_censales;
      const provincias = [...new Set(localidadesGlobal.map(loc => loc.provincia.nombre))].sort();
      provincias.forEach(prov => provinciasSelect.appendChild(new Option(prov, prov)));

      provinciasSelect.addEventListener('change', () => {
        localidadesSelect.innerHTML = '<option value="">Seleccioná una localidad</option>';
        localidadesGlobal
          .filter(loc => loc.provincia.nombre === provinciasSelect.value)
          .sort((a, b) => a.nombre.localeCompare(b.nombre))
          .forEach(loc => localidadesSelect.appendChild(new Option(loc.nombre, loc.nombre)));
      });
    });

  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      alert('Debés iniciar sesión.');
      return window.location.href = 'login.html';
    }

    spinner.style.display = 'block';

    const tipoCuenta = localStorage.getItem('tipoCuenta');
    const coleccion = tipoCuenta === 'comercio' ? 'usuariosComercio' : 'usuarios';
    const dashboardDestino = tipoCuenta === 'comercio' ? 'dashboard-comercio.html' : 'dashboard-usuario.html';
    const docRef = doc(db, coleccion, user.uid);

    try {
      const snap = await getDoc(docRef);

      if (snap.exists()) {
        const d = snap.data();
        getInput('nombre').value = d.nombre || '';
        getInput('apellido').value = d.apellido || '';
        getInput('email').value = d.email || user.email;
        getInput('telefono').value = d.telefono || '';
        getInput('edad').value = d.edad || '';
        getInput('fecha-nacimiento').value = d.fechaNacimiento || '';
        getInput('formacion-academica').value = d.formacion || '';
        getInput('trabajo').value = d.trabajo || '';
        getInput('ecivil').value = d.ecivil || '';
        getInput('hijos').value = d.hijos || '';
        toggleCantidadHijos(d.hijos);
        cantidadHijosInput.value = d.hijos === 'si' ? d.cantidadHijos || '1' : '';
        getInput('direccion').value = d.direccion || '';
        getInput('numero').value = d.numero || '';
        getInput('departamento').value = d.departamento || '';

        if (d.provincia) {
          provinciasSelect.value = d.provincia;
          provinciasSelect.dispatchEvent(new Event('change'));
          setTimeout(() => {
            localidadesSelect.value = d.localidad || '';
          }, 300);
        }
      }

      container.style.display = 'block';

    } catch (err) {
      console.error('Error al obtener perfil:', err.message);
      alert('No se pudo cargar tu perfil.');
    } finally {
      spinner.style.display = 'none';
    }

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const perfil = {
        nombre: getInput('nombre').value.trim(),
        apellido: getInput('apellido').value.trim(),
        email: getInput('email').value.trim(),
        telefono: getInput('telefono').value.trim(),
        edad: getInput('edad').value,
        fechaNacimiento: getInput('fecha-nacimiento').value,
        provincia: provinciasSelect.value,
        localidad: localidadesSelect.value,
        direccion: getInput('direccion').value.trim(),
        numero: getInput('numero').value.trim(),
        departamento: getInput('departamento').value.trim(),
        formacion: getInput('formacion-academica').value,
        trabajo: getInput('trabajo').value,
        ecivil: getInput('ecivil').value,
        hijos: getInput('hijos').value,
        cantidadHijos: getInput('hijos').value === 'si' ? getInput('cantidad-hijos-input').value : '',
        completadoPerfil: true,
      };

      try {
        await setDoc(docRef, perfil, { merge: true });
        alert('Perfil guardado correctamente.');
        window.location.href = dashboardDestino;
      } catch (err) {
        console.error('Error al guardar perfil:', err.message);
        alert('No se pudo guardar tu perfil.');
      }
    });
  });
});


