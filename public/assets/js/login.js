import {
    hideAlert,
    showAlert,
    setButtonLoading,
    loginUser,
    observeAuth,
    getFirebaseErrorMessage
} from './auth.js'

const form = document.getElementById('loginForm')
const emailInput = document.getElementById('email')
const passwordInput = document.getElementById('password')
const loginBtn = document.getElementById('loginBtn')

observeAuth(user => {
    if (user) {
        window.location.href = 'dashboard.html'
    }
})

form?.addEventListener('submit', async (e) => {
    e.preventDefault()

    hideAlert('loginAlert')

    const email = emailInput.value.trim()
    const password = passwordInput.value.trim()

    if (!email || !password) {
        showAlert(
            'loginAlert',
            'Por favor, completa todos los campos'
        )
        return
    }

    try {
        setButtonLoading(
            loginBtn,
            true,
            '<i class="bi bi-box-arrow-in-right me-2"></i> Iniciar sesión',
            'Iniciando sesión...'
        )

        await loginUser({ email, password })

        window.location.href = 'dashboard.html'

    } catch (error) {

        showAlert(
            'loginAlert',
            getFirebaseErrorMessage(error)
        )

    } finally {

        setButtonLoading(
            loginBtn,
            false,
            '<i class="bi bi-box-arrow-in-right me-2"></i> Iniciar sesión'
        )
    }
})