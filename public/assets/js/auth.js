import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-auth.js";
import {
    doc,
    setDoc,
    getDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";

import { auth, db } from "./firebase-config.js";

function generateAccountNumber() {
    return Math.floor(1000000000 + Math.random() * 9000000000).toString();
}

export function showAlert(elementId, message) {
    const alert = document.getElementById(elementId)
    if (!alert) return
    alert.textContent = message
    alert.classList.remove('d-none')
}

export function hideAlert(elementId) {
    const alert = document.getElementById(elementId)
    if (!alert) return
    alert.classList.add('d-none')
    alert.textContent = ''
}

export async function registerUser({ name, email, password, role = "client", extraInfo = {} }) {
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    const user = credential.user;

    await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        name,
        email,
        state: "Active",
        role,
        createdAt: serverTimestamp()
    });

    switch (role) {
        case "client":
            await setDoc(doc(db, "clientes", user.uid), {
                clientId: user.uid,
                phone: extraInfo.phone || "",
                curp: extraInfo.curp || "",
                address: extraInfo.address || "",
                accountNumber: generateAccountNumber(),
                balance: 0,
                state: "Active",
                updatedAt: serverTimestamp()
            });
            break;

        case "staff":
            await setDoc(doc(db, "staff", user.uid), {
                employeeId: user.uid,
                employeeNumber: extraInfo.employeeNumber || "",
                position: extraInfo.position || "",
                sucursal: extraInfo.sucursal || "",
                state: "Active",
                updatedAt: serverTimestamp()
            });
            break;

        default:
            throw new Error('Invalid role');
    }

    return user;
}

export async function loginUser({ email, password }) {
    const credential = await signInWithEmailAndPassword(auth, email, password)
    return credential.user
}

export async function getCurrentUserProfile(uid) {
    if (!uid) return null;

    const docRef = doc(db, 'users', uid);
    const userSnap = await getDoc(docRef);

    if (!userSnap.exists()) return null;

    return userSnap.data();
}

export function observeAuth(callback) {
    return onAuthStateChanged(auth, callback)
}

export async function logoutUser() {
    await signOut(auth)
}

export function getFirebaseErrorMessage(error) {
    const code = error?.code || ''
    switch (code) {
        case 'auth/email-already-in-use':
            return 'El correo ya está registrado'
        case 'auth/invalid-email':
            return 'El correo no es válido'
        case 'auth/weak-password':
            return 'La contraseña debe tener al menos 6 caracteres'
        case 'auth/invalid-credential':
            return 'El correo o la contraseña son incorrectos'
        case 'auth/user-not-found':
            return 'No existe una cuenta con este correo'
        case 'auth/wrong-password':
            return 'El password es incorrecto'
        case 'auth/too-many-requests':
            return 'Demasiados intentos fallidos. Intenta más tarde.'
        default:
            return error?.message || 'Error inesperado';
    }
}

export function setButtonLoading(button, isLoading, text, loadingText = 'Cargando...') {
    if (!button) return

    button.disabled = isLoading
    button.innerHTML = isLoading ? `
    <span class="spinner-border spinner-border-sm me-2" aria-hidden="true">
    </span> 
    ${loadingText}
    ` : text
}
