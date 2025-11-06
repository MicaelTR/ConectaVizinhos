document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector(".login-form");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.querySelector(".input-email").value.trim();
    const senha = document.querySelector(".input-senha").value.trim();

    if (!email || !senha) {
      showModal("⚠️ Preencha todos os campos.", false);
      return;
    }

    try {
      const response = await fetch("http://localhost:3000/usuarios/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, senha }),
      });

      const data = await response.json();

      if (response.ok) {
        // ✅ Salva token e nome do usuário no localStorage
        localStorage.setItem("token", data.token);
        localStorage.setItem("nome", data.usuario.nome);

        showModal("✅ Login realizado com sucesso!", true);

        // Redireciona para index.html depois de 2 segundos
        setTimeout(() => {
          window.location.href = "../index.html";
        }, 2000);
      } else {
        showModal(`❌ ${data.error || "E-mail ou senha incorretos."}`, false);
      }
    } catch (error) {
      console.error("Erro ao fazer login:", error);
      showModal("❌ Erro de conexão com o servidor.", false);
    }
  });

  // Função para mostrar modal de mensagem
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

    modal.querySelector(".custom-modal-content").style.backgroundColor = success
      ? "#2A9D8F"
      : "#E76F51";

    setTimeout(() => {
      modal.classList.remove("active");
    }, 2200);
  }
});
