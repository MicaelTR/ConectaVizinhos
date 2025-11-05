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

// Função para buscar lojas da API
async function fetchStores() {
    try {
        // Substitua esta URL pela sua API real
        const response = await fetch('http://localhost:3000/lojas');
        if (!response.ok) throw new Error("Erro ao carregar lojas da API");
        const stores = await response.json();
        return stores;
    } catch (err) {
        console.error(err);
        // Fallback: array vazio
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
        // Adiciona marcador no mapa (ícone padrão)
        L.marker([s.lat, s.lon])
            .addTo(map)
            .bindPopup(`<strong>${s.nome}</strong><br>${s.endereco}`);

        // Cria card da loja
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

// Botão de localização
btn.addEventListener('click', async () => {
    if (!navigator.geolocation) {
        alert("Seu navegador não suporta geolocalização.");
        return;
    }

    btn.textContent = "Localizando...";

    navigator.geolocation.getCurrentPosition(async pos => {
        const { latitude, longitude } = pos.coords;

        // Mostra o mapa e corrige tamanho
        mapDiv.style.display = "block";
        setTimeout(() => map.invalidateSize(), 100);

        // Adiciona marcador do usuário (ícone padrão)
        L.marker([latitude, longitude])
            .addTo(map)
            .bindPopup("Você está aqui")
            .openPopup();

        map.setView([latitude, longitude], 15);

        // Busca lojas da API
        const stores = await fetchStores();
        renderStores(stores);

        btn.textContent = "📍 Usar minha localização";

    }, err => {
        alert("Não foi possível obter sua localização: " + err.message);
        btn.textContent = "📍 Usar minha localização";
    }, { enableHighAccuracy: true });
});
