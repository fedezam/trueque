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
let rubrosCargados = false;

// Cargar provincias y localidades
function cargarProvinciasYLocalidades() {
  return fetch('localidades.json')
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
}

// Cargar rubros comerciales
function cargarRubros() {
  return fetch('rubros.json')
    .then(res => res.json())
    .then(data => {
      rubrosCargados = true;
      data.rubros_comerciales_principales.forEach(rubro => {
        const option = document.createElement('option');
        option.value = rubro.rubro;
        option.textContent = rubro.rubro;
        rubroSelect.appendChild(option);
      });
    });
}

// Lógica principal
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

  const docRef = doc(db, 'comercios', user.uid);

  try {
    // Cargar primero provincias y rubros
    await Promise.all([cargarProvinciasYLocalidades(), cargarRubros()]);

    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      document.getElementById('nombre').value = data.nombre || '';
      document.getElementById('apellido').value = data.apellido || '';
      document.getElementById('telefono').value = data.telefono || '';
      document.getElementById('edad').value = data.edad || '';

      document.getElementById('nombre-comercio').value = data.nombreComercio || '';
      document.getElementById('direccion-comercio').value = data.direccion || '';
      document.getElementById('redes').

