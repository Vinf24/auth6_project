function showAlert({
    message,
    type = "info",
    confirm = false,
    onAccept = null
}) {

    const modal = document.getElementById("alert-modal");

    if (!modal) return;

    const box = modal.querySelector(".modal-box");
    const messageBox = document.getElementById("alert-message");

    const btnAccept = document.getElementById("alert-accept");
    const btnCancel = document.getElementById("alert-cancel");

    messageBox.textContent = message;

    box.className = "modal-box";
    box.classList.add(`alert-${type}`);

    modal.classList.remove("hidden");

    if (confirm) {
        btnCancel.classList.remove("hidden");
    } else {
        btnCancel.classList.add("hidden");
    }

    btnAccept.onclick = () => {

        modal.classList.add("hidden");

        if (onAccept) {
            onAccept();
        }

    };

    btnCancel.onclick = () => {
        modal.classList.add("hidden");
    };
}