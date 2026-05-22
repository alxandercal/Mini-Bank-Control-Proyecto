import { auth } from "./firebase.js"

import {
    sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js"

const form = document.getElementById("recuperarForm")
const inputCorreo = document.getElementById("correoRecuperar")

form?.addEventListener("submit", async (e) => {

    e.preventDefault()

    const correo = inputCorreo.value.trim()

    if (!correo) {

        Swal.fire(
            "Campo vacío",
            "Ingresa tu correo electrónico",
            "warning"
        )

        return
    }

    try {

        await sendPasswordResetEmail(auth, correo)

        Swal.fire(
            "Correo enviado",
            "Revisa tu bandeja de entrada o spam para recuperar tu contraseña.",
            "success"
        )

        form.reset()

    } catch (error) {

        Swal.fire(
            "Error",
            "No se pudo enviar el correo.",
            "error"
        )

        console.log(error)
    }
})