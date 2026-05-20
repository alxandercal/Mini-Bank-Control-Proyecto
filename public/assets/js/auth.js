auth.js
// Esta asi se queda
export function showAlert(elementId, message) {
    const el = document.getElementById(elementId);
    if (!el) return;
    el.textContent = message;
    el.classList.remove("d-none");
}
// Esta asi se queda
export function hideAlert(elementId) {
    const el = document.getElementById(elementId);
    if (!el) return;
    el.classList.add("d-none");
    el.textContent = "";
}
// Esta asi se queda
export function setButtonLoading(button, isLoading, text, loadingText = "Procesando...") {
    if (!button) return;
    button.disabled = isLoading;
    button.innerHTML = isLoading
        ? `<span class="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>${loadingText}`
        : text;
}
// trabaja sobre la funcion
export async function registerUser({ name, email, password, role }) {
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    const user = credential.user;

    await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        name,
        email,
        // phone,
        // adress:  adress || "",
        // curp,
        state: "Active",
        role: role || "client",
        createdAt: serverTimestamp()
    });
    switch (role) {
        case "client":
            await setDoc(doc(db, "clientes", user.uid)), {
                clientId: user.uid,
                phone: a,
                curp: a,
                address: a,
                accountNumber: generateAccountNumber(),
                balance: 0,
                state: "Active",
                updatedAt: serverTimestamp()
            }
            break;

        case "staff":
            await setDoc(doc(db, "clientes", user.uid)), {
                employeeId: user.uid,
                employeeNumber: a,
                position: a,
                sucursal: sucursal || "",
                state: "Active",
                updatedAt: serverTimestamp()
            }
            break;

        default:
            alert('Unespected problem try again')
            break;

    }

    return user;
}