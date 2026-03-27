const openModal = document.getElementById("open-modal");
const closeModal = document.getElementById("close-modal");
const searchModal = document.getElementById("modal");
const modalContent = document.getElementById("modal-content");

if (openModal) {

    openModal.addEventListener("click", async () => {

        searchModal.style.display = "block";

        const response = await fetch("/search/");
        const html = await response.text();

        modalContent.innerHTML = html;

    });

}

if (closeModal) {

    closeModal.addEventListener("click", () => {

        searchModal.style.display = "none";

    });

}

document.addEventListener("submit", async function (event) {

    if (event.target.id === "user-search-form") {

        event.preventDefault();

        const input = document.getElementById("modal-search");

        if (!input) return;

        const query = input.value;

        const response = await fetch(`/search/?q=${query}`, {
            headers: {
                "X-Requested-With": "XMLHttpRequest"
            }
        });

        const html = await response.text();

        document.getElementById("modal-content").innerHTML = html;

    }

});
