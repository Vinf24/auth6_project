document.addEventListener("DOMContentLoaded", () => {

    const btn = document.getElementById("toggleMFA");

    const dlg = document.getElementById("dlgMFAStatus");
    const dlgData = document.getElementById("dlgMFAStatusData");
    const goBtn = document.getElementById("goMFAStatus");

    function mostrarMensaje(msg) {
        dlgData.textContent = msg;
        showAlert(dlg, 3000);
    }

    btn.addEventListener("click", async () => {
        try {
            const response = await fetch("/auth/toggle-mfa/", {
                method: "POST",
                headers: {
                    "X-CSRFToken": getCookie("csrftoken")
                },
                credentials: "same-origin"
            });

            const data = await response.json();

            if (!response.ok) {
                mostrarMensaje("Error al cambiar MFA");
                return;
            }

            mostrarMensaje(
                "MFA ahora está: " + (data.mfa_required ? "ACTIVO" : "INACTIVO")
            );

        } catch (error) {
            mostrarMensaje("Error de conexión");
        }
    });

    goBtn.addEventListener("click", () => {
        hideAlert(dlg);
    });

});