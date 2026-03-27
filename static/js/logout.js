document.getElementById("logoutBtn").addEventListener("click", async () => {

    await fetch("/auth/logout/", {
        method: "POST",
        headers: {
            "X-CSRFToken": getCookie("csrftoken")
        },
        credentials: "same-origin"
    });

    window.location.href = "/login/";
});