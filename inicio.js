import { auth, db } from './firebase-config.js';
import {
  onAuthStateChanged,
  signOut
} from 'https://www.gstatic.com/firebasejs/11.3.1/firebase-auth.js';

import {
  doc,
  getDoc
} from 'https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js';

const nombreEl = document.getElementById('nombre-usuario');
const tipoEl = document.getElementById('tipo-usuario');
const cerrarSesionBtn = document.getElementById('cerrar-sesion');

// Verifica sesión
onAuthStateChanged(auth, async (user) => {
  if (user) {
    try {
      const uid = user.uid;

      // Intentar primero buscar en 'usuarios'
      let docRef = doc(db, 'usuarios', uid);
      let docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        // Si no está en usuarios, buscar en 'comercios'
        docRef = doc(db, 'comercios', uid);
        docSnap = await getDoc(docRef);
      }

      if (docSnap.exists()) {
        const data = docSnap.data();
        nombreEl.textContent = `Hola, ${data.nombre}`;
        tipoEl.textContent = `Tipo de cuenta: ${data.tipo}`;
      } else {
        alert('No se encontró tu perfil en la base de datos.');
        signOut(auth); // cerramos sesión por seguridad
        window.location.href = 'registro.html';
      }

    } catch (error) {
      console.error('Error al obtener los datos del usuario:', error);
      alert('Error interno al cargar los datos.');
    }

  } else {
    // Si no está logueado, redirigir
    window.location.href = 'registro.html';
  }
});

// Cerrar sesión
cerrarSesionBtn.addEventListener('click', async () => {
  await signOut(auth);
  window.location.href = 'registro.html';
});
