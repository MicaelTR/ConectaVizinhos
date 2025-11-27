// ===============================
// Conecta Vizinhos - Minha Conta
// ===============================

// --- Menu responsivo ---
const menuToggle = document.getElementById('menu-toggle');
const nav = document.getElementById('nav');

if (menuToggle && nav) {
  menuToggle.addEventListener('click', () => {
    nav.classList.toggle('open');
    menuToggle.classList.toggle('active');
  });
}

// --- Quando a página carrega ---
window.addEventListener('DOMContentLoaded', async () => {
  const token = localStorage.getItem('token');

  if (!token) {
    window.location.href = "login.html";
    return;
  }

  try {
    // --- Busca dados do usuário ---
    const response = await fetch('http://localhost:3000/usuarios/minha-conta', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      localStorage.removeItem('token');
      window.location.href = "login.html";
      return;
    }

    const user = await response.json();

    // --- Exibe imagem de perfil corretamente ---
    const imgPerfil = document.getElementById('profileImage');
    if (imgPerfil) {
      if (user.fotoPerfil && user.fotoPerfil.trim() !== '') {
        imgPerfil.src = user.fotoPerfil; // vem direto do backend (GridFS)
      } else {
        imgPerfil.src = '../IMAGENS/avatar.png';
      }
    }

    // --- Exibe os dados do usuário ---
    document.getElementById('nome').textContent = user.nome || "Não informado";
    document.getElementById('email').textContent = user.email || "Não informado";
    document.getElementById('data-nascimento').textContent = user.dataNascimento
      ? new Date(user.dataNascimento).toLocaleDateString('pt-BR')
      : "Não informada";
    document.getElementById('criado-em').textContent = new Date(user.criadoEm || user.createdAt).toLocaleDateString('pt-BR');
    document.getElementById('tipo-usuario').textContent = user.tipo || "Comum";

  } catch (err) {
    console.error('Erro ao carregar conta:', err);
    localStorage.removeItem('token');
    window.location.href = "login.html";
  }

  // --- Botão de sair ---
  const logoutBtn = document.querySelector('.logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      localStorage.removeItem('token');
      window.location.href = "login.html";
    });
  }

  // --- Upload de imagem de perfil via ARQUIVO ---
  const fileInput = document.getElementById('fileInput');
  const fileForm = document.getElementById('fileForm'); // formulário de upload
  const imgPerfil = document.getElementById('profileImage');

  if (fileInput) {
    // 🔥 PRÉ-VISUALIZAÇÃO DA IMAGEM ANTES DO ENVIO
    fileInput.addEventListener('change', (event) => {
      const file = event.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          imgPerfil.src = e.target.result; // Atualiza a imagem de perfil com a escolhida
        };
        reader.readAsDataURL(file);
      }
    });
  }

  if (fileForm && fileInput) {
    fileForm.addEventListener('submit', async (event) => {
      event.preventDefault();

      const file = fileInput.files[0];
      if (!file) {
        alert("📷 Escolha uma imagem antes de enviar.");
        return;
      }

      const formData = new FormData();
      formData.append('foto', file);

      try {
        const res = await fetch('http://localhost:3000/usuarios/upload-foto', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }, // não define Content-Type manualmente
          body: formData
        });

        const data = await res.json();

        if (res.ok && data.fotoPerfil) {
          // Atualiza a imagem definitiva com a nova URL vinda do servidor
          imgPerfil.src = `${data.fotoPerfil}?t=${Date.now()}`; // força o navegador a recarregar
          alert("✅ Foto de perfil enviada com sucesso!");
        } else {
          alert("❌ Erro ao salvar: " + (data.error || 'Erro desconhecido.'));
        }
      } catch (err) {
        console.error('Erro ao enviar foto:', err);
        alert("❌ Falha ao conectar com o servidor.");
      }
    });
  }

  // --- Carregar lojas do usuário ---
  try {
    const lojasRes = await fetch('http://localhost:3000/lojas/minhas', {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const lojasContainer = document.getElementById('lojasContainer');

    if (!lojasRes.ok) {
      lojasContainer.innerHTML = `<p class="error-text">❌ Erro ao carregar suas lojas.</p>`;
      return;
    }

    const lojas = await lojasRes.json();

    if (lojas.length === 0) {
      lojasContainer.innerHTML = `<p class="empty-text">Você ainda não possui lojas cadastradas.</p>`;
    } else {
      lojasContainer.innerHTML = lojas.map(loja => `
          <div class="store-card">
            <img src="${loja.logoId ? `http://localhost:3000/lojas/imagem/${loja.logoId}` : 'https://placehold.co/120x120?text=Logo'}" 
                alt="Logo da loja ${loja.nome}" class="store-logo">

            <img src="${loja.bannerId ? `http://localhost:3000/lojas/imagem/${loja.bannerId}` : 'https://placehold.co/300x120?text=Banner'}" 
                alt="Banner da loja ${loja.nome}" class="store-banner">

            <h3>${loja.nome}</h3>
            <p><strong>Categoria:</strong> ${loja.categoria}</p>
            <p>${loja.descricao || ''}</p>
            <p><i class="fa-solid fa-phone"></i> ${loja.telefone || 'Não informado'}</p>
            <p><i class="fa-solid fa-location-dot"></i> ${loja.endereco || 'Endereço não informado'}</p>

            <div class="store-actions">
              <button class="btn edit-store-btn" data-id="${loja._id}">
                <i class="fa-solid fa-pen-to-square"></i> Editar
              </button>

              <button class="btn delete-store-btn" data-id="${loja._id}">
                <i class="fa-solid fa-trash"></i> Excluir
              </button>
            </div>
          </div>
        `).join('');

    }
  } catch (err) {
    console.error('Erro ao carregar lojas:', err);
  }



// ==========================================================
//  MODAL DE EDIÇÃO DE LOJA
// ==========================================================

const modalEditar = document.getElementById("modalEditarLoja");
const formEditar = document.getElementById("formEditarLoja");
const fecharModalBtn = document.getElementById("fecharModalEditar");

// Abrir o modal
function abrirModal() {
  modalEditar.classList.remove("hidden");
}

// Fechar o modal
function fecharModal() {
  modalEditar.classList.add("hidden");
}

if (fecharModalBtn) {
  fecharModalBtn.addEventListener("click", fecharModal);
}


// ==========================================================
//  BOTÃO EDITAR (ABRE MODAL E CARREGA DADOS)
// ==========================================================
document.querySelectorAll(".edit-store-btn").forEach(btn => {
  btn.addEventListener("click", async (e) => {
    const lojaId = e.target.closest("button").dataset.id;
    const token = localStorage.getItem("token");

    try {
      const res = await fetch(`http://localhost:3000/lojas/${lojaId}`, {
        method: "GET",
        headers: { "Authorization": `Bearer ${token}` }
      });

      const loja = await res.json();

      // Preencher campos do modal
      document.getElementById("editarLojaId").value = loja._id;
      document.getElementById("editarNome").value = loja.nome;
      document.getElementById("editarCategoria").value = loja.categoria;
      document.getElementById("editarDescricao").value = loja.descricao || "";
      document.getElementById("editarEndereco").value = loja.endereco || "";
      document.getElementById("editarTelefone").value = loja.telefone || "";
      document.getElementById("editarMotoboy").value = loja.motoboy ? "true" : "false";

      // Previews
      document.getElementById("editarLogoPreview").src =
        loja.logoId ? `http://localhost:3000/lojas/imagem/${loja.logoId}` : "";

      document.getElementById("editarBannerPreview").src =
        loja.bannerId ? `http://localhost:3000/lojas/imagem/${loja.bannerId}` : "";

      abrirModal();

    } catch (err) {
      console.error("Erro ao carregar loja:", err);
      alert("❌ Erro ao carregar dados da loja.");
    }
  });
});


// ==========================================================
//  BOTÃO SALVAR (PUT /lojas/:id)
// ==========================================================
formEditar.addEventListener("submit", async (e) => {
  e.preventDefault();

  const token = localStorage.getItem("token");
  const lojaId = document.getElementById("editarLojaId").value;

  const formData = new FormData();
  formData.append("nome", document.getElementById("editarNome").value);
  formData.append("categoria", document.getElementById("editarCategoria").value);
  formData.append("descricao", document.getElementById("editarDescricao").value);
  formData.append("endereco", document.getElementById("editarEndereco").value);
  formData.append("telefone", document.getElementById("editarTelefone").value);
  formData.append("motoboy", document.getElementById("editarMotoboy").value);

  // Enviar imagens apenas se o usuário escolheu novas
  const novaLogo = document.getElementById("editarLogo").files[0];
  const novoBanner = document.getElementById("editarBanner").files[0];

  if (novaLogo) formData.append("logo", novaLogo);
  if (novoBanner) formData.append("banner", novoBanner);

  try {
    const res = await fetch(`http://localhost:3000/lojas/${lojaId}`, {
      method: "PUT",
      headers: { "Authorization": `Bearer ${token}` },
      body: formData
    });

    if (!res.ok) {
      alert("❌ Não foi possível salvar as alterações.");
      return;
    }

    alert("✅ Loja atualizada com sucesso!");
    fecharModal();
    location.reload();

  } catch (err) {
    console.error(err);
    alert("❌ Erro ao atualizar a loja.");
  }
});


// ==========================================================
//  BOTÃO EXCLUIR
// ==========================================================
document.querySelectorAll(".delete-store-btn").forEach(btn => {
  btn.addEventListener("click", async (e) => {
    const lojaId = e.target.closest("button").dataset.id;

    if (!confirm("❗ Tem certeza que deseja excluir permanentemente esta loja?")) {
      return;
    }

    const token = localStorage.getItem("token");

    try {
      const res = await fetch(`http://localhost:3000/lojas/${lojaId}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });

      if (!res.ok) {
        alert("❌ Não foi possível excluir a loja.");
        return;
      }

      alert("🗑 Loja excluída com sucesso!");
      location.reload();

    } catch (err) {
      console.error("Erro ao excluir:", err);
      alert("❌ Erro no servidor ao excluir a loja.");
    }
  });
});



  // --- Botão Cadastrar Nova Loja ---
  const novaLojaBtn = document.getElementById('novaLojaBtn');
  if (novaLojaBtn) {
    novaLojaBtn.addEventListener('click', () => {
      window.location.href = "cadastroloja.html";
    });
  }
});
