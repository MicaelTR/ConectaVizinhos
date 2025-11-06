// Preview da imagem
function previewImage(event) {
    const reader = new FileReader();
    reader.onload = function () {
        document.getElementById('profileImage').src = reader.result;
    };
    reader.readAsDataURL(event.target.files[0]);
}

const menuToggle = document.getElementById('menu-toggle');
const nav = document.getElementById('nav');

menuToggle.addEventListener('click', () => {
    nav.classList.toggle('open');
    menuToggle.classList.toggle('active');
});

window.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('token');

    if (!token) {
        // Se não tem token, redireciona para login
        window.location.href = "login.html";
        return;
    }

    try {
        // Busca dados do usuário da rota protegida
        const response = await fetch('http://localhost:3000/usuarios/minha-conta', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            // Token inválido ou expirado
            localStorage.removeItem('token');
            window.location.href = "login.html";
            return;
        }

        const user = await response.json();

        // Preenche os campos da página
        document.getElementById('profileImage').src = user.fotoPerfil || 'https://via.placeholder.com/160';
        document.getElementById('nome').textContent = user.nome;
        document.getElementById('email').textContent = user.email;
        document.getElementById('data-nascimento').textContent = new Date(user.dataNascimento).toLocaleDateString();
        document.getElementById('criado-em').textContent = new Date(user.criadoEm).toLocaleDateString();
        document.getElementById('tipo-usuario').textContent = user.tipo;

    } catch (err) {
        console.error('Erro ao carregar conta:', err);
        localStorage.removeItem('token');
        window.location.href = "login.html";
    }

    // Botão de sair
    const logoutBtn = document.querySelector('.logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('token');
            window.location.href = "login.html";
        });
    }
});
