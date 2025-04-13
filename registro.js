import { auth, db, googleProvider } from "./firebase-config.js";
import {
  getAuth,
  signInWithPopup,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/11.3.1/firebase-auth.js";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  arrayUnion
} from "https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js";

// 📌 Utilidad: generar código único de referido
const generarCodigoReferido = () => {
  const caracteres = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let codigo = "";
  for (let i = 0; i < 6; i++) {
    codigo += caracteres.charAt(Math.floor(Math.random() * caracteres.length));
  }
  return codigo;
};

// 📌 Obtener código de referido desde URL (?ref=ABC123)
const getCodigoReferidoDesdeURL = () => {
  const params = new URLSearchParams(window.location.search);
  return params.get("ref") || null;
};

// 📌 Función para guardar el usuario en Firestore
const saveUserToFirestore = async (user, additionalData = {}) => {
  if (!user) return;

  try {
    const userRef = doc(db, "usuarios", user.uid);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      const codigoReferido = generarCodigoReferido();
      const referidoPor = additionalData.referidoPor || null;

      await setDoc(userRef, {
        uid: user.uid,
        nombre: user.displayName || additionalData.nombre || "Usuario",
        email: user.email,
        telefono: additionalData.telefono || "",
        tipo: additionalData.tipo || "usuario",
        foto: user.photoURL || "",
        codigoReferido,
        referidoPor,
        referidos: [],
        creadoEn: serverTimestamp(),
        tqc: 0,
      });

      console.log("✅ Usuario guardado en Firestore.");

      // Si fue referido por otro, actualizamos al que refirió
      if (referidoPor) {
        const refSnapshot = await getDoc(doc(db, "usuarios", referidoPor));
        if (refSnapshot.exists()) {
          await updateDoc(doc(db, "usuarios", referidoPor), {
            referidos: arrayUnion(user.uid),
          });
          console.log("🔁 Referido agregado al referente");
        }
      }
    } else {
      console.log("ℹ️ El usuario ya existe en Firestore.");
    }
  } catch (error) {
    console.error("❌ Error al guardar en Firestore:", error);
  }
};

// 📌 Detectar si el usuario ya está autenticado
onAuthStateChanged(auth, async (user) => {
  if (user) {
    console.log("✅ Usuario autenticado:", user);
    await saveUserToFirestore(user);
    if (window.location.pathname.includes("registro.html")) {
      window.location.replace("home.html");
    }
  } else {
    console.log("⚠️ No hay usuario autenticado.");
  }
});

// 📌 Registro con Google
document.getElementById("google-login").addEventListener("click", async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    await saveUserToFirestore(result.user, {
      referidoPor: getCodigoReferidoDesdeURL(),
    });
    alert("Inicio de sesión con Google exitoso.");
    window.location.replace("home.html");
  } catch (error) {
    console.error("❌ Error con Google:", error);
    alert("Error: " + error.message);
  }
});

// 📌 Validación de contraseña
const validarPassword = (pass) => {
  const minLength = pass.length >= 6;
  const tieneMayus = /[A-Z]/.test(pass);
  const tieneEspecial = /[!@#$%^&*(),.?":{}|<>]/.test(pass);
  return minLength && tieneMayus && tieneEspecial;
};

// 📌 Registro manual
document.getElementById("register-form").addEventListener("submit", async (event) => {
  event.preventDefault();

  const nombre = document.getElementById("nombre").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  const confirmPassword = document.getElementById("confirm-password").value;
  const telefono = document.getElementById("telefono").value.trim();
  const tipo = document.querySelector('input[name="tipo"]:checked')?.value;
  const referidoPor = getCodigoReferidoDesdeURL();

  // Validaciones
  if (password !== confirmPassword) {
    alert("Las contraseñas no coinciden.");
    return;
  }

  if (!validarPassword(password)) {
    alert("La contraseña no cumple con los requisitos.");
    return;
  }

  if (!tipo) {
    alert("Debes seleccionar si sos Usuario o Comercio.");
    return;
  }

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    await saveUserToFirestore(userCredential.user, {
      nombre,
      telefono,
      tipo,
      referidoPor,
    });

    alert("Registro exitoso.");
    window.location.replace("home.html");
  } catch (error) {
    console.error("❌ Error en el registro:", error);
    alert("Error: " + error.message);
  }
});
