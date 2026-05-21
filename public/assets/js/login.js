//login.js
const form = document.getElementById('loginForm')

form?.addEventListener('submit', (e) => {
    e.preventDefault()

    const email = document.getElementById('email').value.trim()
    const password = document.getElementById('password').value

    if (!email || !password) {
        alert('todos los datos son obligatorios')
        return
    }

    const users = JSON.parse(localStorage.getItem('users')) || []
    const user = users.find(u => u.email === email && u.password === password)

    if (!user) {
        alert('correo o contraseña incorrectos')
        return
    }

    //guardar sesion activa
    localStorage.setItem('currentUser', JSON.stringify(user))

    window.location.href = 'dashboard.html'
})