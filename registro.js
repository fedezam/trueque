import { auth, db, googleProvider } from './firebase-config.js';
import {
  createUserWithEmailAndPassword,
  signInWithPopup,
} from 'https://www.gstatic.com/firebasejs/11.3.1/firebase-auth.js';

import {
  doc,
  setDoc,
  getDoc
} from 'https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js';

const form = document.getElementById('registro-form');
const googleLoginBtn = document.getElementById('google-login');

// Mostrar contraseña
document.getElementById('mostrar-contrasena')?.addEventListener('change', (e) => {
  const tipo = e.target.checked ? 'text' : 'password';
  document.getElementById('password').type = tipo;
  document.getElementById('confirm-password').type = tipo;
});

// Validación de contraseña segura
const validarPassword = (password) => {
  const tieneMayuscula = /[A-Z]/.test(password);
  const tieneEspecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  return password.length >= 6 && tieneMayuscula && tieneEspecial;
};

// Leer código de referido desde la URL
const params = new URLSearchParams(window.location.search);
const referidoPor = params.get('ref') || null;

// Obtener tipo de cuenta
let tipoCuenta = null;
document.querySelectorAll('input[name="tipo-cuenta"]').forEach((input) => {
  input.addEventListener('change', (e) => {
    tipoCuenta = e.target.value;
  });
});

// Generador de código de referido
function generarCodigoReferido() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

// Guardar datos mínimos en localStorage
function guardarTipoCuentaEnLocal() {
  localStorage.setItem('tipoCuenta', tipoCuenta);
}

// Registro con formulario
form.addEventListener('submit', async (e) => {
  e.preventDefault();

  if (!tipoCuenta) {
    alert('Debés seleccionar un tipo de cuenta.');
    return;
  }

  const nombre = document.getElementById('nombre').value.trim();
  const apellido = document.getElementById('apellido').value.trim();
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  const confirmPassword = document.getElementById('confirm-password').value;
  const telefono = document.getElementById('telefono').value.trim();

  if (password !== confirmPassword) {
    alert('Las contraseñas no coinciden.');
    return;
  }

  if (!validarPassword(password)) {
    alert('La contraseña debe tener al menos 6 caracteres, una mayúscula y un carácter especial.');
    return;
  }

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    const coleccion = tipoCuenta === 'usuario' ? 'usuarios' : 'comercios';
    await setDoc(doc(db, coleccion, user.uid), {
      nombre,
      apellido,
      email,
      telefono,
      uid: user.uid,
      registradoCon: 'formulario',
      referidoPor,
      codigoReferido: generarCodigoReferido(),
      creadoEn: new Date().toISOString(),
      completadoPerfil: false
    });

    guardarTipoCuentaEnLocal();
    alert('Registro exitoso.');
    window.location.href = 'completar-perfil.html';

  } catch (error) {
    if (error.code === 'auth/email-already-in-use') {
      alert('Este correo ya está en uso.');
    } else {
      console.error(error);
      alert('Error al registrarse.');
    }
  }
});

// Registro con Google
googleLoginBtn.addEventListener('click', async () => {
  if (!tipoCuenta) {
    alert('Debés seleccionar un tipo de cuenta.');
    return;
  }

  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;

    const coleccion = tipoCuenta === 'usuario' ? 'usuarios' : 'comercios';
    const docRef = doc(db, coleccion, user.uid);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      const nombreCompleto = user.displayName || '';
      const [nombre = '', ...resto] = nombreCompleto.split(' ');
      const apellido = resto.join(' ') || '';
      const telefono = user.phoneNumber || '';

      await setDoc(docRef, {
        nombre,
        apellido,
        email: user.email,
        telefono,
        uid: user.uid,
        registradoCon: 'google',
        referidoPor,
        codigoReferido: generarCodigoReferido(),
        creadoEn: new Date().toISOString(),
        completadoPerfil: false
      });
    }

    guardarTipoCuentaEnLocal();
    alert('Sesión iniciada con Google.');
    window.location.href = 'completar-perfil.html';

  } catch (error) {
    console.error(error);
    alert('Error al iniciar sesión con Google.');
  }
});


