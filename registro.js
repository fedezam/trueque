import { auth, db, googleProvider } from './firebase-config.js';
import {
  createUserWithEmailAndPassword,
  signInWithPopup
} from 'https://www.gstatic.com/firebasejs/11.3.1/firebase-auth.js';
import {
  doc,
  setDoc,
  getDoc
} from 'https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js';

// Elementos del DOM
const form = document.getElementById('registro-form');
const googleLoginBtn = document.getElementById('google-login');

// Mostrar contraseña
document.getElementById('mostrar-contrasena')?.addEventListener('change', (e) => {
  const tipo = e.target.checked ? 'text' : 'password';
  document.getElementById('password').type = tipo;
  document.getElementById('confirm-password').type = tipo;
});

// Validación de contraseña
const validarPassword = (password) => {
  const tieneMayuscula = /[A-Z]/.test(password);
  const tieneEspecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  return password.length >= 6 && tieneMayuscula && tieneEspecial;
};

// Código de referido desde la URL
const params = new URLSearchParams(window.location.search);
const referidoPor = params.get('ref') || null;

// Tipo de cuenta seleccionado
let tipoCuenta = null;
document.querySelectorAll('input[name="tipo-cuenta"]').forEach((input) => {
  input.addEventListener('change', (e) => {
    tipoCuenta = e.target.value;
  });
});

// Código de referido único
function generarCodigoReferido() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

// Guardar tipo de cuenta para uso posterior
function guardarTipoCuentaEnLocal() {
  localStorage.setItem('tipoCuenta', tipoCuenta);
}

// Datos comunes iniciales (usuario o comerciante)
function obtenerDatosBase(user, nombre, apellido, telefono, registradoCon) {
  return {
    nombre,
    apellido,
    email: user.email,
    telefono,
    uid: user.uid,
    registradoCon,
    referidoPor,
    codigoReferido: generarCodigoReferido(),
    creadoEn: new Date().toISOString(),
    completadoPerfil: false,
    edad: '',
    provincia: '',
    localidad: '',
    direccion: '',
    numero: '',
    departamento: '',
    formacion: '',
    trabajo: '',
    ecivil: '',
    hijos: '',
    cantidadHijos: ''
  };
}

// Registro por formulario
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

    const datosBase = obtenerDatosBase(user, nombre, apellido, telefono, 'formulario');

    if (tipoCuenta === 'usuario') {
      await setDoc(doc(db, 'usuarios', user.uid), datosBase);
    } else {
      await setDoc(doc(db, 'usuariosComercio', user.uid), datosBase);

      // Crear documento vacío para el comercio
      await setDoc(doc(db, 'comercios', user.uid), {
        ownerUid: user.uid,
        nombreComercio: '',
        direccion: '',
        numero: '',
        departamento: '',
        provincia: '',
        localidad: '',
        rubro: '',
        enlaceMaps: '',
        linksExtra: Array(9).fill(''),
        redes: {
          web: '',
          instagram: '',
          facebook: ''
        },
        creadoEn: new Date().toISOString(),
        completadoPerfil: false
      });
    }

    guardarTipoCuentaEnLocal();
    alert('Registro exitoso.');
    window.location.href = tipoCuenta === 'usuario'
      ? 'completar-perfil-usuario.html'
      : 'completar-perfil-comercio.html';

  } catch (error) {
    console.error(error);
    alert(error.code === 'auth/email-already-in-use'
      ? 'Este correo ya está en uso.'
      : 'Error al registrarse. Intenta nuevamente.');
  }
});

// Registro con Google
googleLoginBtn.addEventListener('click', async () => {
  if (!tipoCuenta) {
    alert('Debés seleccionar un tipo de cuenta antes de continuar.');
    return;
  }

  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;

    const nombreCompleto = user.displayName || '';
    const [nombre = '', ...resto] = nombreCompleto.split(' ');
    const apellido = resto.join(' ') || '';
    const telefono = user.phoneNumber || '';

    const datosBase = obtenerDatosBase(user, nombre, apellido, telefono, 'google');

    if (tipoCuenta === 'usuario') {
      await setDoc(doc(db, 'usuarios', user.uid), datosBase);
    } else {
      await setDoc(doc(db, 'usuariosComercio', user.uid), datosBase);

      await setDoc(doc(db, 'comercios', user.uid), {
        ownerUid: user.uid,
        nombreComercio: '',
        direccion: '',
        numero: '',
        departamento: '',
        provincia: '',
        localidad: '',
        rubro: '',
        enlaceMaps: '',
        linksExtra: Array(9).fill(''),
        redes: {
          web: '',
          instagram: '',
          facebook: ''
        },
        creadoEn: new Date().toISOString(),
        completadoPerfil: false
      });
    }

    guardarTipoCuentaEnLocal();
    alert('Sesión iniciada con Google.');
    window.location.href = tipoCuenta === 'usuario'
      ? 'completar-perfil-usuario.html'
      : 'completar-perfil-comercio.html';

  } catch (error) {
    console.error('Error con Google:', error);
    alert('Error al iniciar sesión con Google.');
  }
});


