//register.js
const form = document.getElementById('registerForm')
const message = document.getElementById('message')

form?.addEventListener('submit', (e) => {
    e.preventDefault()

    const fullName = document.getElementById('fullName').value.trim()
    const email = document.getElementById('email').value.trim()
    const phone = document.getElementById('phone').value.trim()
    const curp = document.getElementById('curp').value.trim().toUpperCase()
    const address = document.getElementById('address').value.trim()
    const password = document.getElementById('password').value
    const confirmPassword = document.getElementById('confirmPassword').value

    if (!fullName || !email || !phone || !curp || !address || !password || !confirmPassword) {
        showMessage('todos los datos son obligatorios', 'danger')
        return
    }

    if (curp.length !== 18) {
        showMessage('el curp debe tener 18 caracteres', 'danger')
        return
    }

    if (password.length < 6) {
        showMessage('la contraseña debe tener al menos 6 caracteres', 'danger')
        return
    }

    if (password !== confirmPassword) {
        showMessage('las contraseñas no son iguales', 'danger')
        return
    }

    const users = JSON.parse(localStorage.getItem('users')) || []

    if (users.find(u => u.email === email)) {
        showMessage('ya existe una cuenta con ese correo', 'danger')
        return
    }

    users.push({ fullName, email, phone, curp, address, password })
    localStorage.setItem('users', JSON.stringify(users))

    showMessage('cuenta creada correctamente', 'success')

    setTimeout(() => {
        window.location.href = 'login.html'
    }, 1200)
})

function showMessage(text, type) {
    message.className = `alert alert-${type}`
    message.textContent = text
}