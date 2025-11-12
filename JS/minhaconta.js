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
          <img src="${loja.logoId ? `http://localhost:3000/lojas/imagem/${loja.logoId}` : 'https://placehold.co/120x120?text=Logo'}" alt="Logo da loja ${loja.nome}" class="store-logo">
          <img src="${loja.bannerId ? `http://localhost:3000/lojas/imagem/${loja.bannerId}` : 'https://placehold.co/300x120?text=Banner'}" alt="Banner da loja ${loja.nome}" class="store-banner">
          <h3>${loja.nome}</h3>
          <p><strong>Categoria:</strong> ${loja.categoria}</p>
          <p>${loja.descricao || ''}</p>
          <p><i class="fa-solid fa-phone"></i> ${loja.telefone || 'Não informado'}</p>
          <p><i class="fa-solid fa-location-dot"></i> ${loja.endereco || 'Endereço não informado'}</p>
        </div>
      `).join('');
    }
  } catch (err) {
    console.error('Erro ao carregar lojas:', err);
  }

  // --- Botão Cadastrar Nova Loja ---
  const novaLojaBtn = document.getElementById('novaLojaBtn');
  if (novaLojaBtn) {
    novaLojaBtn.addEventListener('click', () => {
      window.location.href = "cadastroloja.html";
    });
  }
});
