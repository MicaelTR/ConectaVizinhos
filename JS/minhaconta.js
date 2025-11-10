// ===============================
// Conecta Vizinhos - Minha Conta
// ===============================

// --- Preview da imagem selecionada ---
function previewImage(event) {
  const file = event.target.files[0];
  if (!file) return; // Evita erro se o usuário cancelar o seletor

  const profileImg = document.getElementById('profileImage');
  const reader = new FileReader();

  reader.onload = function () {
    if (profileImg) {
      profileImg.src = reader.result; // Mostra o preview da imagem selecionada
    }
  };

  reader.readAsDataURL(file);
}

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

  // Se não estiver logado, redireciona
  if (!token) {
    window.location.href = "login.html";
    return;
  }

  try {
    // Buscar dados do usuário
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

    // --- Exibição da imagem do perfil (corrigido) ---
    const imgPerfil = document.getElementById('profileImage');
    if (imgPerfil) {
      imgPerfil.src = user.fotoPerfil
        ? user.fotoPerfil
        : 'https://placehold.co/160x160?text=Perfil';
    }

    // --- Exibe informações do usuário ---
    document.getElementById('nome').textContent = user.nome;
    document.getElementById('email').textContent = user.email;
    document.getElementById('data-nascimento').textContent = new Date(user.dataNascimento).toLocaleDateString('pt-BR');
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

  // --- Upload da imagem de perfil ---
  const imageInput = document.getElementById('imageInput');
  const saveBtn = document.querySelector('.save-btn');

  if (saveBtn && imageInput) {
    saveBtn.addEventListener('click', async () => {
      const foto = imageInput.files[0];
      if (!foto) return alert("📷 Selecione uma imagem primeiro.");

      const formData = new FormData();
      formData.append('foto', foto);

      try {
        const res = await fetch('http://localhost:3000/usuarios/upload-foto', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
          body: formData
        });

        const data = await res.json();

        if (res.ok && data.fotoPerfil) {
          // Atualiza a imagem no DOM com cache-buster
          document.getElementById('profileImage').src = `${data.fotoPerfil}?t=${Date.now()}`;
          alert("✅ Foto de perfil atualizada com sucesso!");
        } else {
          alert("❌ Erro ao salvar foto: " + (data.error || 'Erro desconhecido.'));
        }
      } catch (err) {
        console.error('Erro ao enviar imagem:', err);
        alert("❌ Erro ao conectar com o servidor. Verifique se o backend está rodando em http://localhost:3000");
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
      window.location.href = "cadastroloja.html"; // Redireciona para página de cadastro
    });
  }
});
