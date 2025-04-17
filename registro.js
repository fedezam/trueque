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
const mostrarCheckbox = document.getElementById('mostrar-contrasena');
if (mostrarCheckbox) {
  mostrarCheckbox.addEventListener('change', (e) => {
    const tipo = e.target.checked ? 'text' : 'password';
    document.getElementById('password').type = tipo;
    document.getElementById('confirm-password').type = tipo;
  });
}

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
    tipoCuenta = e.target.id;
  });
});

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
    alert('La contraseña no cumple con los requisitos.');
    return;
  }

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    const coleccion = tipoCuenta === 'tipo-usuario' ? 'usuarios' : 'comercios';
    const docRef = doc(db, coleccion, user.uid);
    await setDoc(docRef, {
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

    // Guardar datos en localStorage para usarlos en completar-perfil.html
    localStorage.setItem('nombre', nombre);
    localStorage.setItem('apellido', apellido);
    localStorage.setItem('telefono', telefono);
    localStorage.setItem('email', email);

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

    const coleccion = tipoCuenta === 'tipo-usuario' ? 'usuarios' : 'comercios';
    const docRef = doc(db, coleccion, user.uid);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      await setDoc(docRef, {
        nombre: user.displayName || '',
        apellido: '', // Podés completarlo en "completar-perfil"
        email: user.email,
        telefono: user.phoneNumber || '',
        uid: user.uid,
        registradoCon: 'google',
        referidoPor,
        codigoReferido: generarCodigoReferido(),
        creadoEn: new Date().toISOString(),
        completadoPerfil: false
      });
    }

    // Guardar en localStorage también
    localStorage.setItem('nombre', user.displayName || '');
    localStorage.setItem('apellido', '');
    localStorage.setItem('telefono', user.phoneNumber || '');
    localStorage.setItem('email', user.email);

    alert('Sesión iniciada con Google.');
    window.location.href = 'completar-perfil.html';

  } catch (error) {
    console.error(error);
    alert('Error al iniciar sesión con Google.');
  }
});

// Generador de código de referido aleatorio
function generarCodigoReferido() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let codigo = '';
  for (let i = 0; i < 6; i++) {
    codigo += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return codigo;
}

