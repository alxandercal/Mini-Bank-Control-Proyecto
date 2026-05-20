<<<<<<< HEAD
import { showAlert, hideAlert } from "./auth.js"

// Constantes de la pagina
const form = document.getElementById("registerForm");
const btnRegistro = document.getElementById("registerBtn");

form?.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = document.getElementById("name").value.trim()
    const email = document.getElementById("email").value.trim()
    const phone = document.getElementById("phone").value
    const curp = document.getElementById("curp").value
    const adress = document.getElementById("address").value
    const password = document.getElementById("password").value.trim()
    const confirmPassword = document.getElementById("confirmPassword").value.trim()



    console.log("name->", name)
    console.log("email->", email)
    console.log("phone->", phone)
    console.log("curp->", curp)
    console.log("address->", address)
    console.log("password->", password)
    console.log("confirmPassword->", confirmPassword)

    if (!name || !email || !password || !confirmPassword) {
        showAlert("registerAlert", 'Todos los datos son obligatorios')
        return
    }
    if (password !== confirmPassword) {
        showAlert("registerAlert", 'Las contrasenas no son iguales')
        return
    }
    if (password.length < 6) {
        showAlert("registerAlert", 'La constaseña debe de ser de al menos 6 caracteres')
        return
    }
    // try {
    //     //const registerBtn = document.getElementById('registerBtn')
    //     //setButtonLoading(registerBtn, true, '<i class="bi bi-person-check me-2"></i>Crear cuenta', 'Registrando...')


    // } catch (error) {

    // }


})

=======
import { hideAlert, showAlert, setButtonLoading, registerUser, getFirebaseErrorMessage } from "./auth.js";

const form = document.getElementById('registerForm')
const nameInput = document.getElementById('name')
const emailInput = document.getElementById('email')
const passwordInput = document.getElementById('password')
const confirmPasswordInput = document.getElementById('confirmPassword')
const registerBtn = document.getElementById('registerBtn')
>>>>>>> oscar
