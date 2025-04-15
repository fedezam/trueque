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
 
 const form = document.getElementById('register-form');
 const googleLoginBtn = document.getElementById('google-login');
 
 // Mostrar contraseña
 document.getElementById('mostrar-contrasena').addEventListener('change', (e) => {
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
 
 // Obtener el tipo de cuenta seleccionado (usuario o comercio)
 const obtenerTipoCuenta = () => {
   const tipo = document.querySelector('input[name="tipo"]:checked');
   return tipo ? tipo.value : null;
 };
 
 // Verifica si un usuario ya existe en Firestore
 const existeUsuario = async (tipo, uid) => {
   const docRef = doc(db, `${tipo}s`, uid);
   const docSnap = await getDoc(docRef);
   return docSnap.exists();
 };
 
 // Registro con formulario
 form.addEventListener('submit', async (e) => {
   e.preventDefault();
 
   const nombre = document.getElementById('nombre').value.trim();
   const email = document.getElementById('email').value.trim();
   const password = document.getElementById('password').value;
   const confirmPassword = document.getElementById('confirm-password').value;
   const telefono = document.getElementById('telefono').value.trim();
   const tipo = obtenerTipoCuenta();
 
   if (!tipo) {
     alert('Por favor, seleccioná si sos Usuario o Comercio.');
     return;
   }
 
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
 
     const docRef = doc(db, `${tipo}s`, user.uid);
     await setDoc(docRef, {
       nombre,
       email,
       telefono,
       tipo,
       uid: user.uid,
       registradoCon: 'formulario',
       creadoEn: new Date().toISOString()
     });
 
     alert('Registro exitoso.');
     window.location.href = 'inicio.html';
     
     // Redirigimos a la página adecuada según el tipo de cuenta
     if (tipo === 'usuario') {
       window.location.href = 'dashboard-usuario.html';
     } else if (tipo === 'comercio') {
       window.location.href = 'dashboard-comercio.html';
     }
 
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
   const tipo = obtenerTipoCuenta();
 
   if (!tipo) {
     alert('Seleccioná primero si sos Usuario o Comercio.');
     return;
   }
 
   try {
     const result = await signInWithPopup(auth, googleProvider);
     const user = result.user;
 
     const yaExiste = await existeUsuario(tipo, user.uid);
 
     if (!yaExiste) {
       const docRef = doc(db, `${tipo}s`, user.uid);
       await setDoc(docRef, {
         nombre: user.displayName || '',
         email: user.email,
         telefono: user.phoneNumber || '',
         tipo,
         uid: user.uid,
         registradoCon: 'google',
         creadoEn: new Date().toISOString()
       });
     }
 
     alert('Sesión iniciada con Google.');
     window.location.href = 'inicio.html';
 
     // Redirigimos a la página adecuada según el tipo de cuenta
     if (tipo === 'usuario') {
       window.location.href = 'dashboard-usuario.html';
     } else if (tipo === 'comercio') {
       window.location.href = 'dashboard-comercio.html';
     }
 
   } catch (error) {
     console.error(error);
     alert('Error al iniciar sesión con Google.');
   }
 });
    console.error(error);
    alert('Error al iniciar sesión con Google.');
  }
});

