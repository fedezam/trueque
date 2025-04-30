// verificar-sesion.js
// Este archivo se encarga de verificar que el usuario esté autenticado, registrado y con perfil completo.

import { auth, db } from './firebase-config.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/11.3.1/firebase-auth.js';
import { doc, getDoc } from 'https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js';

/**
 * Configuración de rutas
 */
const config = {
  rutasPublicas: [
    '/trueque/completar-perfil-usuario.html',
    '/trueque/completar-perfil-comercio.html'
  ],
  rutasRedireccion: {
    usuario: 'completar-perfil-usuario.html',
    comercio: 'completar-perfil-comercio.html'
  }
};

/**
 * Verifica si la ruta actual está permitida
 * @param {string} ruta - window.location.pathname
 * @param {boolean} completadoPerfil
 * @returns {boolean}
 */
function tieneAcceso(ruta, completadoPerfil) {
  return config.rutasPublicas.includes(ruta) || completadoPerfil;
}

/**
 * Redirige al usuario a la página de completar perfil correspondiente
 * @param {'usuario'|'comercio'} tipoCuenta
 */
function redirigirPerfilIncompleto(tipoCuenta) {
  console.warn('Perfil incompleto. Redirigiendo a completar perfil.');
  window.location.href = config.rutasRedireccion[tipoCuenta];
}

/**
 * Función principal que comprueba la sesión y, si existe,
 * carga el documento de Firestore y verifica completadoPerfil.
 */
export function verificarSesion() {
  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      // No hay usuario autenticado: enviamos al login
      return window.location.href = 'login.html';
    }

    // Obtenemos el tipo de cuenta del localStorage
    const tipoCuenta = localStorage.getItem('tipoCuenta') || 'usuario';
    const coleccion = tipoCuenta === 'comercio' ? 'usuariosComercio' : 'usuarios';
    const docRef = doc(db, coleccion, user.uid);

    try {
      const snap = await getDoc(docRef);
      const data = snap.exists() ? snap.data() : {};

      // Si el perfil NO está marcado como completado y la ruta no es pública,
      // forzamos redirección
      if (!tieneAcceso(window.location.pathname, data.completadoPerfil)) {
        return redirigirPerfilIncompleto(tipoCuenta);
      }

      // Si llegamos aquí, el usuario puede continuar
      console.log('✅ Sesión verificada y perfil OK o en página de completar.');
    } catch (err) {
      console.error('Error verificando perfil:', err);
      alert('Ocurrió un error al verificar tu sesión. Intenta recargando la página.');
    }
  });
}


