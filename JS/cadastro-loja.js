// ===============================
// Conecta Vizinhos - Cadastro de Loja
// ===============================

// --- Preview das imagens ---
function previewLogo(event) {
  const file = event.target.files[0];
  if (!file) return;

  const logoPreview = document.getElementById('logoPreview');
  const reader = new FileReader();

  reader.onload = () => {
    if (logoPreview) logoPreview.src = reader.result;
  };

  reader.readAsDataURL(file);
}

function previewBanner(event) {
  const file = event.target.files[0];
  if (!file) return;

  const bannerPreview = document.getElementById('bannerPreview');
  const reader = new FileReader();

  reader.onload = () => {
    if (bannerPreview) bannerPreview.src = reader.result;
  };

  reader.readAsDataURL(file);
}

// --- Submissão do formulário ---
const form = document.getElementById('cadastroLojaForm');



if (form) {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = new FormData(form);

    // ⚠️ Corrige o campo temEntregador (string → boolean)
    const motoboyValue = formData.get("motoboy");
    formData.set("motoboy", motoboyValue === "true");

    try {
      const token = localStorage.getItem('token'); // token do login
      if (!token) {
        alert('❌ Você precisa estar logado para cadastrar uma loja.');
        window.location.href = 'login.html';
        return;
      }

      const response = await fetch('http://localhost:3000/lojas/cadastrar', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
          // ⚠️ NÃO colocar Content-Type aqui! O FormData já define corretamente.
        },
        body: formData
      });

      if (!response.ok) {
        let errMsg = 'Erro desconhecido';
        try {
          const err = await response.json();
          errMsg = err.error || err.message || errMsg;
        } catch (_) {}

        alert('❌ Erro: ' + errMsg);
        return;
      }

      const data = await response.json();
      alert('✅ Loja cadastrada com sucesso! ID da loja: ' + data.loja._id);

      // Reset do formulário
      form.reset();

      // Reset das imagens
      const logoPreview = document.getElementById('logoPreview');
      const bannerPreview = document.getElementById('bannerPreview');

      if (logoPreview)
        logoPreview.src = 'https://placehold.co/120x120?text=Logo';

      if (bannerPreview)
        bannerPreview.src = 'https://placehold.co/300x120?text=Banner';

    } catch (error) {
      console.error('Erro ao enviar formulário:', error);
      alert('❌ Erro no envio: ' + error.message + '. Verifique se o servidor está rodando.');
    }
  });
}
