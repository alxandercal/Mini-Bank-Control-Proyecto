import { auth } from "./firebase.js"
import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js"

const form = document.getElementById("loginForm")

form?.addEventListener("submit", async (e) => {
    e.preventDefault()

    const email = document.getElementById("email").value.trim()
    const password = document.getElementById("password").value

    if (!email || !password) {
        alert("todos los datos son obligatorios")
        return
    }

    try {
        await signInWithEmailAndPassword(auth, email, password)
        window.location.href = "dashboard.html"
    } catch (error) {
        alert("correo o contraseña incorrectos")
    }
})