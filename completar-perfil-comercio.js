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
const rubroSelect = document.getElementById('rubro'); // Asegúrate de que este elemento exista en tu HTML

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
        console.error('Error al cargar provincias y localidades:', err);
        alert('Error al cargar la información de ubicación. Por favor, intenta nuevamente más tarde.');
    });

// Verificar sesión y cargar/guardar datos
onAuthStateChanged(auth, async (user) => {
    if (!user) {
        alert('Debés iniciar sesión primero.');
        window.location.href = 'login.html';
        return;
    }

    const tipoCuenta = localStorage.getItem('tipoCuenta');
    if (tipoCuenta !== 'comercio') {
        console.error('Tipo de cuenta incorrecto:', tipoCuenta);
        alert('Error: Esta página es solo para cuentas de comercio.');
        return window.location.href = 'dashboard-usuario.html'; // O la página apropiada
    }

    const coleccion = 'comercios';
    const dashboardDestino = 'dashboard-comercio.html';
    const docRef = doc(db, coleccion, user.uid);

    try {
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const data = docSnap.data();
            document.getElementById('nombre').value = data.nombre || '';
            document.getElementById('telefono').value = data.telefono || '';
            document.getElementById('direccion').value = data.direccion || '';
            document.getElementById('cuit').value = data.cuit || '';
            document.getElementById('razon-social').value = data.razonSocial || '';
            rubroSelect.value = data.rubro || ''; // Establecer el valor del select de rubro

            if (data.provincia) {
                provinciasSelect.value = data.provincia;
                provinciasSelect.dispatchEvent(new Event('change'));
                setTimeout(() => {
                    localidadesSelect.value = data.localidad || '';
                }, 500); // Esperar a que carguen localidades
            }
        } else {
            console.log('No existe el documento del comercio. Creando uno nuevo.');
            // Si no existe, puedes inicializar algunos campos obligatorios aquí si es necesario
            // await setDoc(docRef, { /* datos iniciales */ });
        }
    } catch (err) {
        console.error('Error al obtener datos del perfil del comercio:', err);
        alert('Error al cargar el perfil del comercio. Por favor, intenta nuevamente más tarde.');
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const perfilActualizado = {
            nombre: document.getElementById('nombre').value.trim(),
            telefono: document.getElementById('telefono').value.trim(),
            direccion: document.getElementById('direccion').value.trim(),
            cuit: document.getElementById('cuit').value.trim(),
            razonSocial: document.getElementById('razon-social').value.trim(),
            provincia: provinciasSelect.value,
            localidad: localidadesSelect.value,
            rubro: rubroSelect.value, // Obtener el valor del select de rubro
            completadoPerfil: true,
        };

        try {
            await setDoc(docRef, perfilActualizado, { merge: true });
            alert('Perfil del comercio guardado correctamente.');
            window.location.href = dashboardDestino;
        } catch (err) {
            console.error('Error al guardar el perfil del comercio:', err);
            alert('Error al guardar el perfil del comercio. Por favor, intenta nuevamente.');
        }
    });
});
