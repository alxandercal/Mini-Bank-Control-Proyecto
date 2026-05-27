import {
    doc,
    getDoc,
    writeBatch,
    collection,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js"

import { auth, db } from "./firebase-config.js"
import { logoutUser, showAlert, hideAlert, setButtonLoading } from "./auth.js"

const form = document.getElementById("retirarForm")
const amountInput = document.getElementById("amount")
const retirarBtn = document.getElementById("retirarBtn")
const logoutBtn = document.getElementById("logoutBtn")

const openNoCard = document.getElementById("openNoCard")
const openDebitCard = document.getElementById("openDebitCard")
const noCardPanel = document.getElementById("noCardPanel")
const debitCardPanel = document.getElementById("debitCardPanel")
const barcodeBox = document.getElementById("barcodeBox")
const barcodeText = document.getElementById("barcodeText")
const withdrawAmountText = document.getElementById("withdrawAmountText")

const money = new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN"
})

function openPanel(panel) {
    noCardPanel?.classList.remove("is-open")
    debitCardPanel?.classList.remove("is-open")

    panel?.classList.add("is-open")

    hideAlert("retirarAlert")
    hideAlert("retirarSuccess")
}

function createWithdrawCode() {
    return String(Math.floor(100000000000 + Math.random() * 900000000000))
}

function updateBarcodeBars(code) {
    const bars = document.querySelectorAll("#barcodeBars span")

    bars.forEach((bar, index) => {
        const digit = Number(code[index % code.length])
        const width = digit % 2 === 0 ? 5 : 10
        const height = digit > 5 ? 100 : 78

        bar.style.width = `${width}px`
        bar.style.height = `${height}%`
    })
}

openNoCard?.addEventListener("click", () => {
    openPanel(noCardPanel)
})

openDebitCard?.addEventListener("click", () => {
    openPanel(debitCardPanel)
})

form?.addEventListener("submit", async e => {
    e.preventDefault()

    hideAlert("retirarAlert")
    hideAlert("retirarSuccess")

    const amount = Number(amountInput.value)

    if (!amount || amount <= 0) {
        showAlert("retirarAlert", "Ingresa un monto válido")
        return
    }

    try {
        setButtonLoading(
            retirarBtn,
            true,
            '<i class="bi bi-upc-scan me-2"></i> Generar código',
            "Procesando..."
        )

        const user = auth.currentUser

        if (!user) {
            window.location.href = "login.html"
            return
        }

        const clientRef = doc(db, "clientes", user.uid)
        const clientSnap = await getDoc(clientRef)

        if (!clientSnap.exists()) {
            showAlert("retirarAlert", "No se encontró la cuenta del cliente")
            return
        }

        const clientData = clientSnap.data()
        const currentBalance = Number(clientData.balance || 0)
        const totalWithdraws = Number(clientData.totalWithdraws || 0)

        if (amount > currentBalance) {
            showAlert("retirarAlert", "Saldo insuficiente")
            return
        }

        const newBalance = currentBalance - amount
        const newTotalWithdraws = totalWithdraws + amount
        const withdrawCode = createWithdrawCode()

        const movementRef = doc(collection(db, "movimientos"))
        const batch = writeBatch(db)

        batch.update(clientRef, {
            balance: newBalance,
            totalWithdraws: newTotalWithdraws,
            updatedAt: serverTimestamp()
        })

        batch.set(movementRef, {
            userId: user.uid,
            clientId: user.uid,
            type: "retiro",
            tipo: "Retiro",
            method: "sin tarjeta",
            amount,
            monto: amount,
            code: withdrawCode,
            previousBalance: currentBalance,
            newBalance,
            createdAt: serverTimestamp(),
            fecha: serverTimestamp()
        })

        await batch.commit()

        if (barcodeText) {
            barcodeText.textContent = withdrawCode
        }

        if (withdrawAmountText) {
            withdrawAmountText.textContent = money.format(amount)
        }

        updateBarcodeBars(withdrawCode)

        barcodeBox?.classList.remove("d-none")
        amountInput.value = ""

        showAlert("retirarSuccess", "Código generado correctamente. El dinero se descontó de tu cuenta.")

    } catch (error) {
        console.error(error)
        showAlert("retirarAlert", "Error al generar el retiro")
    } finally {
        setButtonLoading(
            retirarBtn,
            false,
            '<i class="bi bi-upc-scan me-2"></i> Generar código'
        )
    }
})

logoutBtn?.addEventListener("click", async e => {
    e.preventDefault()
    await logoutUser()
    window.location.href = "login.html"
})