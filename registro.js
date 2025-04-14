import { auth, db, googleProvider } from "./firebase-config.js";
import {
  signInWithPopup,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
} from "https://www.gstatic.com/firebasejs/11.3.1/firebase-auth.js";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  arrayUnion
} from "https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js";

// Generar código de referido
const generarCodigoReferido = () => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

const getCodigoReferidoDesdeURL = () => {
  const params = new URLSearchParams(window.location.search);
  return params.get("ref") || null;
};

const validarPassword = (pass) => {
  return (
    pass.length >= 6 &&
    /[A-Z]/.test(pass) &&
    /[!@#$%^&*(),.?":{}|<>]/.test(pass)
  );
};

const validarEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const validarTelefono = (telefono) => /^\d{8,15}$/.test(telefono);

// Guardar en Firestore
const saveUserToFirestore = async (user, additional = {}) => {
  if (!user) return;

  const tipo = additional.tipo;
  if (!tipo) throw new Error("Tipo de usuario no definido");

  const coleccion = tipo === "comercio" ? "comercios" : "usuarios";
  const userRef = doc(db, coleccion, user.uid);
  const userDoc = await getDoc(userRef);

  if (!userDoc.exists()) {
    const codigoReferido = generarCodigoReferido();
    const referidoPor = additional.referidoPor || null;

    await setDoc(userRef, {
      uid: user.uid,
      nombre: user.displayName || additional.nombre || "Usuario",
      email: user.email,
      telefono: additional.telefono || "",
      tipo,
      foto: user.photoURL || "",
      codigoReferido,
      referidoPor,
      referidos: [],
      creadoEn: serverTimestamp(),
      tqc: 0,
    });

    console.log(`✅ Guardado en colección '${coleccion}'.`);

    if (referidoPor) {
      let refSnapshot = await getDoc(doc(db, "usuarios", referidoPor));
      let refColeccion = "usuarios";

      if (!refSnapshot.exists()) {
        refSnapshot = await getDoc(doc(db, "comercios", referidoPor));
        refColeccion = "comercios";
      }

      if (refSnapshot.exists()) {
        await updateDoc(doc(db, refColeccion, referidoPor), {
          referidos: arrayUnion(user.uid),
        });
        console.log(`🔁 Referido agregado en '${refColeccion}'`);
      } else {
        console.warn("⚠️ Código de referido no encontrado");
      }
    }
  } else {
    console.log("ℹ️ Ya existe en la colección.");
  }
};

// Registro manual
document.getElementById("register-form").addEventListener("submit", async (e) => {
  e.preventDefault();

  const nombre = document.getElementById("nombre").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  const confirm = document.getElementById("confirm-password").value;
  const telefono = document.getElementById("telefono")?.value.trim() || "";
  const tipo = document.querySelector('input[name="tipo"]:checked')?.value;
  const referidoPor = getCodigoReferidoDesdeURL();

  if (!validarEmail(email)) return alert("Correo inválido.");
  if (telefono && !validarTelefono(telefono)) return alert("Teléfono inválido.");
  if (password !== confirm) return alert("Las contraseñas no coinciden.");
  if (!validarPassword(password)) return alert("La contraseña no cumple con los requisitos.");
  if (!tipo) return alert("Seleccioná Usuario o Comercio.");

  try {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await saveUserToFirestore(cred.user, { nombre, telefono, tipo, referidoPor });
    alert("Registro exitoso.");
    window.location.replace("home.html");
  } catch (error) {
    alert("Error en el registro: " + error.message);
    console.error(error);
  }
});

// Registro con Google
document.getElementById("google-login").addEventListener("click", async (e) => {
  e.preventDefault();

  const tipo = document.querySelector('input[name="tipo"]:checked')?.value;

  if (!tipo || (tipo !== "usuario" && tipo !== "comercio")) {
    alert("Seleccioná si sos Usuario o Comercio antes de continuar con Google.");
    return;
  }

  try {
    const result = await signInWithPopup(auth, googleProvider);
    const telefono = document.getElementById("telefono")?.value.trim() || "";
    const referidoPor = getCodigoReferidoDesdeURL();

    await saveUserToFirestore(result.user, {
      tipo,
      telefono,
      referidoPor,
    });

    alert("Inicio de sesión con Google exitoso.");
    window.location.replace("home.html");
  } catch (error) {
    alert("Error con Google: " + error.message);
    console.error(error);
  }
});

// Mostrar/ocultar contraseña
document.getElementById("mostrar-contrasena").addEventListener("change", (e) => {
  const show = e.target.checked;
  document.getElementById("password").type = show ? "text" : "password";
  document.getElementById("confirm-password").type = show ? "text" : "password";
});

// Recuperar contraseña
document.getElementById("recuperar-link").addEventListener("click", async (e) => {
  e.preventDefault();
  const email = prompt("Ingresá tu correo para recuperar tu contraseña:");
  if (!email || !validarEmail(email)) return alert("Correo inválido.");

  try {
    await sendPasswordResetEmail(auth, email);
    alert("Te enviamos un correo con instrucciones.");
  } catch (error) {
    alert("Error al enviar el correo: " + error.message);
    console.error(error);
  }
});

// Usuario ya autenticado (por si recarga)
onAuthStateChanged(auth, async (user) => {
  if (user && window.location.pathname.includes("registro.html")) {
    const tipo = document.querySelector('input[name="tipo"]:checked')?.value;
    if (!tipo) return;
    await saveUserToFirestore(user, {
      referidoPor: getCodigoReferidoDesdeURL(),
      tipo,
    });
  }
});
