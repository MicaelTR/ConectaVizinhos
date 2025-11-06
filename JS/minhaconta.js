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

    // Preenche os dados do usuário
    document.getElementById('profileImage').src = user.fotoPerfil
      ? `http://localhost:3000${user.fotoPerfil}`
      : 'https://placehold.co/160x160?text=Perfil';

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
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          body: formData
        });

        const data = await res.json();

        if (res.ok && data.fotoPerfil) {
          // 🔧 Usa a URL completa e força reload com timestamp
          const novaFoto = data.fotoPerfil.startsWith("http")
            ? data.fotoPerfil
            : `http://localhost:3000${data.fotoPerfil}?t=${Date.now()}`;

          document.getElementById('profileImage').src = novaFoto;
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
});
