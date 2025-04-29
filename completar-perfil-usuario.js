import { verificarSesion } from './verificar-sesion.js';
verificarSesion();

import { auth, db } from './firebase-config.js';
import { doc, setDoc, getDoc } from 'https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/11.3.1/firebase-auth.js';

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('completar-perfil-form');
  const provinciasSelect = document.getElementById('provincia');
  const localidadesSelect = document.getElementById('localidad');
  const cantidadHijosDiv = document.getElementById('cantidad-hijos');
  const cantidadHijosInput = document.getElementById('cantidad-hijos-input');
  const hijosSelect = document.getElementById('hijos');
  const spinner = document.getElementById('spinner');
  const container = document.getElementById('perfil-container');

  if (!form || !provinciasSelect || !localidadesSelect || !spinner || !container) {
    console.error('❌ Elementos clave no encontrados en el DOM');
    alert('Error interno: faltan elementos del formulario.');
    return;
  }

  // Función para acceder a inputs del formulario por name
  const getInput = (name) => form.querySelector(`[name="${name}"]`);

  const toggleCantidadHijos = (valor) => {
    if (!cantidadHijosDiv || !cantidadHijosInput) return;
    cantidadHijosDiv.style.display = valor === 'si' ? 'block' : 'none';
    if (valor !== 'si') cantidadHijosInput.value = '0';
  };

  if (hijosSelect) {
    hijosSelect.addEventListener('change', (e) => toggleCantidadHijos(e.target.value));
  }

  // Cargar provincias y localidades
  let localidadesGlobal = [];

  fetch('localidades.json')
    .then(res => res.json())
    .then(data => {
      console.log('🌍 Localidades cargadas');
      localidadesGlobal = data.localidades_censales;
      const provincias = [...new Set(localidadesGlobal.map(loc => loc.provincia.nombre))].sort();
      provincias.forEach(prov => {
        provinciasSelect.appendChild(new Option(prov, prov));
      });

      provinciasSelect.addEventListener('change', () => {
        const seleccion = provinciasSelect.value;
        localidadesSelect.innerHTML = '<option value="">Seleccioná una localidad</option>';
        localidadesGlobal
          .filter(loc => loc.provincia.nombre === seleccion)
          .sort((a, b) => a.nombre.localeCompare(b.nombre))
          .forEach(loc => {
            localidadesSelect.appendChild(new Option(loc.nombre, loc.nombre));
          });
      });
    })
    .catch(err => {
      console.error('🔥 Error cargando provincias/localidades:', err.message);
      alert('Error al cargar provincias. Intentalo más tarde.');
    });

  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      alert('Debés iniciar sesión primero.');
      return window.location.href = 'login.html';
    }

    spinner.style.display = 'block';

    const tipoCuenta = localStorage.getItem('tipoCuenta');
    const coleccion = tipoCuenta === 'comercio' ? 'usuariosComercio' : 'usuarios';
    const dashboardDestino = tipoCuenta === 'comercio' ? 'dashboard-comercio.html' : 'dashboard-usuario.html';
    const docRef = doc(db, coleccion, user.uid);

    try {
      console.log('🔍 Buscando datos de usuario...');
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const d = docSnap.data();
        console.log('✅ Datos cargados:', d);

        getInput('nombre').value = d.nombre || '';
        getInput('apellido').value = d.apellido || '';
        getInput('telefono').value = d.telefono || '';
        getInput('edad').value = d.edad || '';
        getInput('formacion-academica').value = d.formacion || '';
        getInput('trabajo').value = d.trabajo || '';
        getInput('ecivil').value = d.ecivil || '';
        getInput('hijos').value = d.hijos || 'no';
        toggleCantidadHijos(d.hijos);
        cantidadHijosInput.value = d.hijos === 'si' ? (d.cantidadHijos || '1') : '0';
        getInput('direccion').value = d.direccion || '';
        getInput('departamento').value = d.departamento || '';

        if (d.provincia) {
          provinciasSelect.value = d.provincia;
          provinciasSelect.dispatchEvent(new Event('change'));
          setTimeout(() => {
            localidadesSelect.value = d.localidad || '';
          }, 300);
        }
      } else {
        console.warn('⚠️ Usuario sin datos previos');
      }

      container.style.display = 'block';

    } catch (err) {
      console.error('🔥 Error al obtener datos:', err.message);
      alert('No se pudo cargar tu perfil: ' + err.message);
    } finally {
      spinner.style.display = 'none';
    }

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      console.log('💾 Guardando perfil...');

      const perfilActualizado = {
        nombre: getInput('nombre').value.trim(),
        apellido: getInput('apellido').value.trim(),
        telefono: getInput('telefono').value.trim(),
        edad: getInput('edad').value,
        provincia: provinciasSelect.value,
        localidad: localidadesSelect.value,
        direccion: getInput('direccion').value.trim(),
        departamento: getInput('departamento').value.trim(),
        formacion: getInput('formacion-academica').value,
        trabajo: getInput('trabajo').value,
        ecivil: getInput('ecivil').value,
        hijos: getInput('hijos').value,
        cantidadHijos: getInput('hijos').value === 'si' ? cantidadHijosInput.value.trim() : '0',
        completadoPerfil: true,
      };

      try {
        await setDoc(docRef, perfilActualizado, { merge: true });
        console.log('✅ Perfil actualizado correctamente');
        alert('Perfil guardado.');
        window.location.href = dashboardDestino;
      } catch (err) {
        console.error('🔥 Error guardando perfil:', err.message);
        alert('No se pudo guardar tu perfil: ' + err.message);
      }
    });
  });

  window.recargarPerfil = async function () {
    alert('Reintentando carga...');
    spinner.style.display = 'block';
    try {
      const user = auth.currentUser;
      const tipoCuenta = localStorage.getItem('tipoCuenta');
      const docRef = doc(db, tipoCuenta === 'comercio' ? 'usuariosComercio' : 'usuarios', user.uid);
      const docSnap = await getDoc(docRef);
      console.log('📥 Recarga manual:', docSnap.data());
    } catch (e) {
      console.error('🛑 Error en recarga manual:', e.message);
    } finally {
      spinner.style.display = 'none';
    }
  };
});

