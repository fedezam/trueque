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

  // Mostrar u ocultar el campo de cantidad de hijos
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
        const option = new Option(prov, prov);
        provinciasSelect.appendChild(option);
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
        if (!form.nombre) {
  console.error('❌ Campo "nombre" no existe en el formulario');
  return alert('El formulario está mal cargado. Revisá el HTML.');
}

        console.log('✅ Datos cargados:', d);

        form.nombre.value = d.nombre || '';
        form.apellido.value = d.apellido || '';
        form.telefono.value = d.telefono || '';
        form.edad.value = d.edad || '';
        form['formacion-academica'].value = d.formacion || '';
        form.trabajo.value = d.trabajo || '';
        form.ecivil.value = d.ecivil || '';
        form.hijos.value = d.hijos || 'no';
        toggleCantidadHijos(form.hijos.value);
        form['cantidad-hijos-input'].value = d.hijos === 'si' ? (d.cantidadHijos || '1') : '0';
        form.direccion.value = d.direccion || '';
        form.departamento.value = d.departamento || '';

        if (d.provincia) {
          provinciasSelect.value = d.provincia;
          provinciasSelect.dispatchEvent(new Event('change'));
          setTimeout(() => {
            localidadesSelect.value = d.localidad || '';
          }, 300); // Esperar que se llenen
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
        nombre: form.nombre.value.trim(),
        apellido: form.apellido.value.trim(),
        telefono: form.telefono.value.trim(),
        edad: form.edad.value,
        provincia: provinciasSelect.value,
        localidad: localidadesSelect.value,
        direccion: form.direccion.value.trim(),
        departamento: form.departamento.value.trim(),
        formacion: form['formacion-academica'].value,
        trabajo: form.trabajo.value,
        ecivil: form.ecivil.value,
        hijos: form.hijos.value,
        cantidadHijos: form.hijos.value === 'si' ? form['cantidad-hijos-input'].value.trim() : '0',
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

  // Botón manual de prueba (opcional para debug)
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
