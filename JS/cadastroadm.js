document.addEventListener("DOMContentLoaded", () => {
  const btnCancelar = document.querySelector(".button-cancel");
  const btnConfirmar = document.querySelector(".button-confirm");

  // === Cancelar: volta para a página anterior ===
  btnCancelar.addEventListener("click", () => {
    history.back();
  });

  // === Confirmar (Enviar formulário ADMIN) ===
  btnConfirmar.addEventListener("click", async (e) => {
    e.preventDefault();

    const nome = document.querySelector(".input-nome").value.trim();
    const dataNascimento = document.querySelector(".input-idade").value;
    const email = document.querySelector(".input-email").value.trim();
    const senha = document.querySelector(".input-senha").value.trim();

    // Validação
    if (!nome || !dataNascimento || !email || !senha) {
      showModal("⚠️ Preencha todos os campos.", false);
      return;
    }

    try {
      const response = await fetch("http://localhost:3000/admin/cadastro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome,
          email,
          dataNascimento,
          senha
          // ❌ tipo removido — o model já define admin automaticamente
        }),
      });

      const data = await response.json().catch(() => null);

      if (response.ok) {
        showModal("👑 Admin cadastrado com sucesso!", true);
        setTimeout(() => {
          window.location.href = "login.html";
        }, 2500);
      } else {
        showModal(`❌ ${data?.error || "Erro ao cadastrar administrador."}`, false);
      }
    } catch (error) {
      console.error("Erro ao enviar cadastro:", error);
      showModal("❌ Não foi possível conectar ao servidor.", false);
    }
  });

  // === Modal reutilizável ===
  function showModal(message, success = true) {
    let modal = document.querySelector(".custom-modal");

    if (!modal) {
      modal = document.createElement("div");
      modal.className = "custom-modal";
      modal.innerHTML = `
        <div class="custom-modal-content">
          <p class="modal-message"></p>
        </div>
      `;
      document.body.appendChild(modal);
    }

    const msgEl = modal.querySelector(".modal-message");
    msgEl.textContent = message;

    modal.classList.add("active");
    modal.querySelector(".custom-modal-content").style.backgroundColor =
      success ? "#2A9D8F" : "#E76F51";

    setTimeout(() => {
      modal.classList.remove("active");
    }, 2200);
  }
});
