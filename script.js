// Importa los módulos de Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-app.js";
import { 
    getAuth, createUserWithEmailAndPassword, signInWithPopup, 
    GoogleAuthProvider, updateProfile, onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/11.3.1/firebase-auth.js";
import { getFirestore, collection, addDoc } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js";

// Configuración de Firebase
const firebaseConfig = {
    apiKey: "AIzaSyAgIPuOIfvYp191JZI9cKLRkKXfGwdaCxM",
    authDomain: "trueque-28b33.firebaseapp.com",
    projectId: "trueque-28b33",
    storageBucket: "trueque-28b33.firebasestorage.app",
    messagingSenderId: "6430433157",
    appId: "1:6430433157:web:1e6cf47ee1ed80b127eeec",
    measurementId: "G-JMDRX032BS"
};

// Inicializa Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth();
const db = getFirestore();
const googleProvider = new GoogleAuthProvider();

// Redirige si el usuario ya está autenticado
onAuthStateChanged(auth, (user) => {
    if (user) {
        console.log("✅ Usuario autenticado. Redirigiendo a home...");
        window.location.replace("https://fedezam.github.io/trueque/home.html");
    } else {
        console.log("🔴 Usuario NO autenticado. Se queda en registro.");
    }
});

// Función para registrar usuario con email y contraseña
const registerUser = async (e) => {
    e.preventDefault();

    const nombre = document.getElementById("nombre").value;
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const telefono = document.getElementById("telefono").value;

    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        await updateProfile(user, { displayName: nombre });

        await addDoc(collection(db, "usuarios"), {
            uid: user.uid,
            nombre,
            email,
            telefono
        });

        alert("Registro exitoso.");
        window.location.replace("https://fedezam.github.io/trueque/home.html");
    } catch (error) {
        alert("Error: " + error.message);
    }
};

// Función para autenticación con Google
const loginWithGoogle = async () => {
    try {
        const result = await signInWithPopup(auth, googleProvider);
        alert("Inicio de sesión con Google exitoso.");
        window.location.replace("https://fedezam.github.io/trueque/home.html");
    } catch (error) {
        alert("Error: " + error.message);
    }
};

// Eventos de los botones
document.getElementById("register-form").addEventListener("submit", registerUser);
document.getElementById("google-login").addEventListener("click", loginWithGoogle);

//home.html
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut, updateProfile } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAgIPuOIfvYp191JZI9cKLRkKXfGwdaCxM",
  authDomain: "trueque-28b33.firebaseapp.com",
  projectId: "trueque-28b33",
  storageBucket: "trueque-28b33.firebasestorage.app",
  messagingSenderId: "6430433157",
  appId: "1:6430433157:web:1e6cf47ee1ed80b127eeec",
  measurementId: "G-JMDRX032BS"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth();
const db = getFirestore();

// Verifica si el usuario está autenticado
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.replace("registro.html");
  } else {
    document.getElementById("welcome-message").textContent = `Bienvenido ${user.displayName}`;
    
    // Obtener la cantidad de TqC (futura implementación)
    const userDoc = await getDoc(doc(db, "usuarios", user.uid));
    if (userDoc.exists()) {
      const userData = userDoc.data();
      document.getElementById("tqc-balance").textContent = `Tienes (${userData.tqc || 0}) TqC`;
    }
  }
});

// Botón para descargar MetaMask
document.getElementById("download-metamask").addEventListener("click", () => {
  window.open("https://metamask.io/download/", "_blank");
});

// Botón para agregar la red AMOI de Polygon
document.getElementById("add-polygon-network").addEventListener("click", async () => {
  try {
    await window.ethereum.request({
      method: "wallet_addEthereumChain",
      params: [{
        chainId: "0x13882", // ID de la red AMOI
        chainName: "Polygon AMOI",
        nativeCurrency: {
          name: "MATIC",
          symbol: "MATIC",
          decimals: 18
        },
        rpcUrls: ["https://rpc-amoi.polygon.io"],
        blockExplorerUrls: ["https://amoi-explorer.polygon.io"]
      }]
    });
    alert("Red AMOI añadida con éxito.");
  } catch (error) {
    alert("Error al agregar la red: " + error.message);
  }
});

// Guardar dirección de wallet
document.getElementById("save-wallet").addEventListener("click", async () => {
  const user = auth.currentUser;
  const walletAddress = document.getElementById("wallet-address").value.trim();

  if (!walletAddress) {
    alert("Por favor, ingresa una dirección de wallet.");
    return;
  }

  try {
    await setDoc(doc(db, "usuarios", user.uid), { wallet: walletAddress }, { merge: true });
    alert("BILLETERA VINCULADA CON ÉXITO! DISFRUTA DE NUESTROS ANUNCIANTES");
    window.location.replace("task.html");
  } catch (error) {
    alert("Error al guardar la wallet: " + error.message);
  }
});
