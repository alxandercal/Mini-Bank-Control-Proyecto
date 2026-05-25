import {
    doc,
    getDoc,
    updateDoc,
    addDoc,
    collection,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js"

import { auth, db } from "./firebase.js"
import { logoutUser } from './auth.js'

const logoutBtn = document.getElementById('logoutBtn')
const withdrawBtn = document.getElementById('withdrawBtn')
const balanceText = document.getElementById('balanceText')

const money = new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN'
})

async function retirarDinero() {
    const amount = Number(prompt('Ingresa el monto a retirar'))

    if (!amount || amount <= 0) {
        alert('Ingresa un monto válido')
        return
    }

    const user = auth.currentUser

    if (!user) {
        alert('No hay sesión iniciada')
        window.location.href = 'login.html'
        return
    }

    const clientRef = doc(db, 'clientes', user.uid)
    const clientSnap = await getDoc(clientRef)

    if (!clientSnap.exists()) {
        alert('No se encontró la cuenta del cliente')
        return
    }

    const clientData = clientSnap.data()
    const currentBalance = Number(clientData.balance || 0)

    if (amount > currentBalance) {
        alert('Saldo insuficiente')
        return
    }

    const newBalance = currentBalance - amount

    await updateDoc(clientRef, {
        balance: newBalance,
        updatedAt: serverTimestamp()
    })

    await addDoc(collection(db, 'movimientos'), {
        userId: user.uid,
        type: 'retiro',
        amount,
        previousBalance: currentBalance,
        newBalance,
        createdAt: serverTimestamp()
    })

    if (balanceText) {
        balanceText.textContent = money.format(newBalance)
    }

    alert('Retiro realizado correctamente')
}

withdrawBtn?.addEventListener('click', async () => {
    try {
        await retirarDinero()
    } catch (error) {
        console.error('Error al retirar dinero', error)
        alert('Error al retirar dinero')
    }
})

logoutBtn?.addEventListener('click', async e => {
    e.preventDefault()

    try {
        await logoutUser()
        window.location.href = 'login.html'
    } catch (error) {
        console.error('Error al cerrar sesión', error)
    }
})