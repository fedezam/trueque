import { verificarSesion } from './verificar-sesion.js';
verificarSesion();

import { auth, db } from './firebase-config.js';
import { doc, setDoc, getDoc } from 'https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/11.3.1/firebase-auth.js';

document.addEventListener('DOMContentLoaded', () => {
  const form               = document.getElementById('completar-perfil-form');
  const spinner            = document.getElementById('spinner');
  const container          = document.getElementById('perfil-container');
  const fnInput            = document.getElementById('fecha-nacimiento');
  const edadInput          = document.getElementById('edad');
  const provinciasSelect   = document.getElementById('provincia');
  const localidadesSelect  = document.getElementById('localidad');
  const hijosSelect        = document.getElementById('hijos');
  const cantidadHijosDiv   = document.getElementById('cantidad-hijos');
  const cantidadHijosInput = document.getElementById('cantidad-hijos-input');

  // — Validación mínima del DOM —
  if (![form, spinner, container, fnInput, edadInput].every(el => el)) {
    console.error('❌ Faltan elementos en el DOM');
    return alert('Error interno: formulario incompleto.');
  }

  // — Cálculo de edad a partir de fecha de nacimiento —
  const calcularEdad = fechaStr => {
    const hoy = new Date();
    const fn  = new Date(fechaStr);
    let edad  = hoy.getFullYear() - fn.getFullYear();
    // Ajuste si aún no cumplió
    if (
      hoy.getMonth()  < fn.getMonth() ||
      (hoy.getMonth() === fn.getMonth() && hoy.getDate() < fn.getDate())
    ) edad--;
    return edad;
  };

  fnInput.addEventListener('change', e => {
    const valor = e.target.value;
    if (valor) {
      edadInput.value = calcularEdad(valor);
    } else {
      edadInput.value = '';
    }
  });

  // — Mostrar/ocultar cantidad de hijos —
  hijosSelect.addEventListener('change', e => {
    const v = e.target.value;
    cantidadHijosDiv.style.display = v === 'si' ? 'block' : 'none';
    if (v !== 'si') cantidadHijosInput.value = '';
  });

  // — Cargar provincias y localidades (igual que antes) —
  let localidadesGlobal = [];
  fetch('localidades.json')
    .then(r => r.json())
    .then(data => {
      localidadesGlobal = data.localidades_censales;
      const provs = [...new Set(localidadesGlobal.map(l => l.provincia.nombre))].sort();
      provs.forEach(p => provinciasSelect.appendChild(new Option(p, p)));
      provinciasSelect.addEventListener('change', () => {
        localidadesSelect.innerHTML = '<option value="">Seleccioná una localidad</option>';
        localidadesGlobal
          .filter(l => l.provincia.nombre === provinciasSelect.value)
          .sort((a, b) => a.nombre.localeCompare(b.nombre))
          .forEach(loc => localidadesSelect.appendChild(new Option(loc.nombre, loc.nombre)));
      });
    })
    .catch(err => {
      console.error('Error cargando localidades:', err);
      alert('No se pudieron cargar provincias. Intentalo luego.');
    });

  // — Sesión / Firestore —
  onAuthStateChanged(auth, async user => {
    if (!user) {
      alert('Iniciá sesión primero.');
      return window.location.href = 'login.html';
    }
    spinner.style.display = 'block';

    const tipoCuenta    = localStorage.getItem('tipoCuenta');
    const coleccion     = tipoCuenta === 'comercio' ? 'usuariosComercio' : 'usuarios';
    const dashboardDest = tipoCuenta === 'comercio'
      ? 'dashboard-comercio.html'
      : 'dashboard-usuario.html';
    const ref           = doc(db, coleccion, user.uid);

    try {
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const d = snap.data();
        // Datos personales
        document.getElementById('nombre').value = d.nombre || '';
        document.getElementById('apellido').value = d.apellido || '';
        document.getElementById('email').value = d.email || '';
        document.getElementById('telefono').value = d.telefono || '';

        if (d.fechaNacimiento) {
          fnInput.value = d.fechaNacimiento;
          edadInput.value = calcularEdad(d.fechaNacimiento);
        }

        // Dirección & localidad
        document.getElementById('direccion').value = d.direccion || '';
        document.getElementById('numero').value = d.numero || '';
        document.getElementById('departamento').value = d.departamento || '';

        if (d.provincia) {
          provinciasSelect.value = d.provincia;
          provinciasSelect.dispatchEvent(new Event('change'));
          setTimeout(() => localidadesSelect.value = d.localidad || '', 300);
        }

        // Situación
        document.getElementById('formacion-academica').value = d.formacion || '';
        document.getElementById('trabajo').value = d.trabajo || '';
        document.getElementById('ecivil').value = d.ecivil || '';
        hijosSelect.value = d.hijos || 'no';
        hijosSelect.dispatchEvent(new Event('change'));
        if (d.hijos === 'si') cantidadHijosInput.value = d.cantidadHijos || '';
      }

      container.style.display = 'block';

    } catch (err) {
      console.error('Error al leer perfil:', err);
      alert('No se pudo cargar tu perfil.');
    } finally {
      spinner.style.display = 'none';
    }

    // — Guardar perfil —
    form.addEventListener('submit', async e => {
      e.preventDefault();
      const perfil = {
        nombre: document.getElementById('nombre').value.trim(),
        apellido: document.getElementById('apellido').value.trim(),
        email: document.getElementById('email').value.trim(),
        telefono: document.getElementById('telefono').value.trim(),
        fechaNacimiento: fnInput.value,
        edad: parseInt(edadInput.value, 10) || null,
        provincia: provinciasSelect.value,
        localidad: localidadesSelect.value,
        direccion: document.getElementById('direccion').value.trim(),
        numero: document.getElementById('numero').value.trim(),
        departamento: document.getElementById('departamento').value.trim(),
        formacion: document.getElementById('formacion-academica').value,
        trabajo: document.getElementById('trabajo').value,
        ecivil: document.getElementById('ecivil').value,
        hijos: hijosSelect.value,
        cantidadHijos: hijosSelect.value === 'si'
          ? cantidadHijosInput.value.trim()
          : '',
        completadoPerfil: true
      };

      try {
        await setDoc(ref, perfil, { merge: true });
        alert('Perfil guardado.');
        window.location.href = dashboardDest;
      } catch (err) {
        console.error('Error guardando perfil:', err);
        alert('No se pudo guardar tu perfil.');
      }
    });
  });
});



