const menuToggle = document.getElementById('menu-toggle');
const nav = document.getElementById('nav');
const mapDiv = document.getElementById('map');

menuToggle.addEventListener('click', () => {
    nav.classList.toggle('open');
    menuToggle.classList.toggle('active');
});

// Inicializa o mapa, mas deixa invisível
const map = L.map('map').setView([-23.55, -46.63], 13);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap'
}).addTo(map);
mapDiv.style.display = "none";

const btn = document.getElementById('btnLocate');
const list = document.getElementById('storeList');
const storeSectionTitle = document.getElementById('storeSectionTitle');

// Botões e área de boas-vindas
const btnRegister = document.querySelector('.btn-register');
const btnLogin = document.querySelector('.btn-login');

// ================================
// Verifica se o usuário está logado
// ================================
function checkLogin() {
    const token = localStorage.getItem('token');
    const nome = localStorage.getItem('nome'); 

    const hero = document.querySelector('.hero');
    // Remove mensagens ou botões anteriores
    const existingMsg = document.querySelector('#welcome-msg');
    const existingLogout = document.querySelector('#btnLogout');
    if (existingMsg) existingMsg.remove();
    if (existingLogout) existingLogout.remove();

    if (token && nome) {
        // Usuário logado: esconde botões de login/cadastro
        if (btnRegister) btnRegister.style.display = 'none';
        if (btnLogin) btnLogin.style.display = 'none';

        // Cria mensagem de boas-vindas
        const msg = document.createElement('p');
        msg.id = 'welcome-msg';
        msg.textContent = `Bem-vindo de volta, ${nome}!`;
        msg.style.fontSize = '2rem'; // maior destaque
        msg.style.marginTop = '20px';
        msg.style.fontWeight = '700';
        hero.appendChild(msg);


    } else {
        // Não logado: mostra botões de login/cadastro
        if (btnRegister) btnRegister.style.display = 'inline-block';
        if (btnLogin) btnLogin.style.display = 'inline-block';
    }
}


// Chama no carregamento da página
checkLogin();

// ==========================
// Redirecionamento dos botões de cadastro e login
// ==========================
if (btnRegister) {
    btnRegister.addEventListener('click', () => {
        window.location.href = "HTML/cadastro.html";
    });
}

if (btnLogin) {
    btnLogin.addEventListener('click', () => {
        window.location.href = "HTML/login.html";
    });
}

// ==========================
// Função para buscar lojas
// ==========================
async function fetchStores() {
    try {
        const response = await fetch('http://localhost:3000/lojas');
        if (!response.ok) throw new Error("Erro ao carregar lojas da API");
        const stores = await response.json();
        return stores;
    } catch (err) {
        console.error(err);
        return [];
    }
}

function renderStores(stores) {
    list.innerHTML = '';
    if (stores.length === 0) {
        storeSectionTitle.style.display = "none";
        return;
    }

    storeSectionTitle.style.display = "block";

    stores.forEach(s => {
        L.marker([s.lat, s.lon])
            .addTo(map)
            .bindPopup(`<strong>${s.nome}</strong><br>${s.endereco}`);

        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
          <img src="${s.imagem}" alt="${s.nome}" class="main" onclick="openImage('${s.imagem}')">
          <div class="card-content">
            <div class="info">
              <img src="${s.logo}" class="logo-loja" alt="Logo ${s.nome}">
              <div class="textos">
                <strong>${s.nome}</strong>
                <div class="small">${s.endereco}</div>
              </div>
            </div>
            <p class="descricao">${s.descricao}</p>
            <div class="bottom-row">
              <div class="categoria">${s.categoria}</div>
                <a class="ver-mais" href="HTML/perfil.html?id=${s.id}">Ver mais</a>
            </div>
          </div>
        `;
        list.appendChild(card);
    });
}

function openImage(url) {
    const modal = document.getElementById('imageModal');
    const img = document.getElementById('modalImg');
    img.src = url;
    modal.classList.add('active');
}

// ==========================
// Botão de localização
// ==========================
btn.addEventListener('click', async () => {
    if (!navigator.geolocation) {
        alert("Seu navegador não suporta geolocalização.");
        return;
    }

    btn.textContent = "Localizando...";

    navigator.geolocation.getCurrentPosition(async pos => {
        const { latitude, longitude } = pos.coords;

        mapDiv.style.display = "block";
        setTimeout(() => map.invalidateSize(), 100);

        L.marker([latitude, longitude])
            .addTo(map)
            .bindPopup("Você está aqui")
            .openPopup();

        map.setView([latitude, longitude], 15);

        const stores = await fetchStores();
        renderStores(stores);

        btn.textContent = "📍 Usar minha localização";

    }, err => {
        alert("Não foi possível obter sua localização: " + err.message);
        btn.textContent = "📍 Usar minha localização";
    }, { enableHighAccuracy: true });
});
