// verificar-sesion.js
// Este archivo se encarga de verificar que el usuario esté autenticado, registrado y con perfil completo.

import { auth, db } from './firebase-config.js';
import {
  onAuthStateChanged
} from 'https://www.gstatic.com/firebasejs/11.3.1/firebase-auth.js';
import {
  doc,
  getDoc
} from 'https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js';

/**
 * Verifica que haya sesión activa, cuenta correcta y perfil completo.
 * 
 * Si todo está OK, resuelve el usuario, el tipo de cuenta y los datos del Firestore.
 * Si algo falla, redirige automáticamente a la página correspondiente.
 * 
 * @returns {Promise<{user: Object, tipoCuenta: string, data: Object}>}
 */
export function verificarSesion() {
  return new Promise((resolve, reject) => {
    onAuthStateChanged(auth, async (user) => {
      if (!user || !user.uid) {
        console.warn('No hay sesión activa.');
        window.location.href = "inicio.html";
        return reject('No autenticado');
      }

      const tipoCuenta = localStorage.getItem("tipoCuenta");
      if (!tipoCuenta || (tipoCuenta !== "usuario" && tipoCuenta !== "comercio")) {
        console.warn('Tipo de cuenta inválido o no especificado.');
        window.location.href = "inicio.html";
        return reject('Tipo de cuenta inválido');
      }

      const coleccion = tipoCuenta === "usuario" ? "usuarios" : "usuariosComercio";
      const docRef = doc(db, coleccion, user.uid);

      try {
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
          console.warn('El documento del usuario no existe.');
          window.location.href = "inicio.html";
          return reject('Usuario no encontrado');
        }

        const data = docSnap.data();

        if (!data.completadoPerfil) {
          console.warn('Perfil incompleto. Redirigiendo a completar perfil.');
          const paginaPerfil = tipoCuenta === "usuario"
            ? "completar-perfil-usuario.html"
            : "completar-perfil-comercio.html";
          window.location.href = paginaPerfil;
          return reject('Perfil incompleto');
        }

        // Todo está bien
        resolve({ user, tipoCuenta, data });

      } catch (err) {
        console.error('Error verificando sesión:', err);
        window.location.href = "inicio.html";
        reject('Error en verificación');
      }
    });
  });
}


