import {
    registerUser,
    getFirebaseErrorMessage,
    setButtonLoading,
    showAlert,
    hideAlert
} from "./auth.js";

// Constantes de la pagina
const form = document.getElementById("registerForm");
const btnRegistro = document.getElementById("registerBtn");

form?.addEventListener("submit", async (e) => {
    e.preventDefault();
    hideAlert("registerAlert")

    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const phone = document.getElementById("phone").value.trim();
    const curp = document.getElementById("curp").value.trim();
    const address = document.getElementById("address").value.trim();
    const password = document.getElementById("password").value.trim();
    const confirmPassword = document.getElementById("confirmPassword").value.trim();

    //Validaciones de front
    if (!name || !email || !phone || !curp || !address || !password || !confirmPassword) {
        showAlert("registerAlert", 'Todos los datos son obligatorios')
        return
    }
    if (password !== confirmPassword) {
        showAlert("registerAlert", 'Las contraseñas no son iguales')
        return
    }
    if (password.length < 6) {
        showAlert("registerAlert", 'La contraseña debe ser de al menos 6 caracteres')
        return
    }
    if (phone.length !== 10) {
        showAlert("registerAlert", 'Da un numero de telefono valido')
        return
    }
    if (curp.length !== 18) {
        showAlert("registerAlert", 'Da una curp valida')
        return
    }

    try {
        setButtonLoading(btnRegistro, true, '<i class="bi bi-person-check me-2"></i>Crear cuenta', 'Registrando...')

        //crea la variable de informacion que solo tienen los clientes
        const extraInfo = {
            phone,
            curp,
            address
        };

        const user = await registerUser({
            name,
            email,
            password,
            role: "client",
            extraInfo
        });

        console.log("Usuario registrado con éxito:", user);
        window.location.href = "login.html";
    } catch (error) {
        console.error("Error en el registro:", error);
        const errorMessage = getFirebaseErrorMessage(error);
        showAlert("registerAlert", errorMessage);
    } finally {
        setButtonLoading(btnRegistro, false, '<i class="bi bi-person-check me-2"></i>Crear cuenta');
    }
})