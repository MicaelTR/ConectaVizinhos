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

let userMarker = null;
let storeMarkers = [];
const btn = document.getElementById('btnLocate');
const list = document.getElementById('storeList');

const fakeStores = [
    {
        nome: "Padaria do João",
        categoria: "Padaria",
        descricao: "Pães fresquinhos e bolos caseiros todos os dias.",
        endereco: "Rua das Flores, 120",
        lat: -23.552,
        lon: -46.634,
        imagem: "https://images.unsplash.com/photo-1587241321921-91e5b7a1a8b9",
        logo: "https://cdn-icons-png.flaticon.com/512/3075/3075977.png"
    },
    {
        nome: "Mercadinho da Ana",
        categoria: "Mercado",
        descricao: "Tudo o que você precisa sem sair do bairro.",
        endereco: "Av. Brasil, 45",
        lat: -23.548,
        lon: -46.628,
        imagem: "https://images.unsplash.com/photo-1580910051073-dedbdfd3b9f8",
        logo: "https://cdn-icons-png.flaticon.com/512/2331/2331970.png"
    },
    {
        nome: "Farmácia Popular",
        categoria: "Farmácia",
        descricao: "Remédios e cuidados de saúde com atendimento humanizado.",
        endereco: "Rua Central, 99",
        lat: -23.556,
        lon: -46.630,
        imagem: "https://images.unsplash.com/photo-1587854692152-93dcf38a42c2",
        logo: "https://cdn-icons-png.flaticon.com/512/2966/2966327.png"
    },
    {
        nome: "Lanchonete Sabor Local",
        categoria: "Lanchonete",
        descricao: "Lanches rápidos e deliciosos feitos com carinho.",
        endereco: "Praça das Árvores, 15",
        lat: -23.550,
        lon: -46.635,
        imagem: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5",
        logo: "https://cdn-icons-png.flaticon.com/512/857/857681.png"
    }
];

const userIcon = L.icon({ iconUrl: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png', iconSize: [24, 24], iconAnchor: [12, 24] });
const shopIcon = L.icon({ iconUrl: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png', iconSize: [24, 24], iconAnchor: [12, 24] });

function renderStores(stores) {
    storeMarkers.forEach(m => map.removeLayer(m));
    storeMarkers = [];
    list.innerHTML = '';

    stores.forEach(s => {
        const marker = L.marker([s.lat, s.lon], { icon: shopIcon }).addTo(map);
        marker.bindPopup(`<strong>${s.nome}</strong><br>${s.endereco}`);
        storeMarkers.push(marker);

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
              <a class="ver-mais" href="javascript:void(0)" onclick="openImage('${s.imagem}')">Ver mais</a>
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

// Mostra o mapa apenas quando clicar no botão
btn.addEventListener('click', () => {
    if (!navigator.geolocation) {
        alert("Seu navegador não suporta geolocalização.");
        return;
    }
    btn.textContent = "Localizando...";
    navigator.geolocation.getCurrentPosition(pos => {
        const { latitude, longitude } = pos.coords;
        mapDiv.style.display = "block"; // Mostra o mapa
        setTimeout(() => map.invalidateSize(), 100); // Corrige o tamanho
        if (userMarker) map.removeLayer(userMarker);
        userMarker = L.marker([latitude, longitude], { icon: userIcon }).addTo(map).bindPopup("Você está aqui").openPopup();
        map.setView([latitude, longitude], 15);
        renderStores(fakeStores);
        btn.textContent = "📍 Usar minha localização";
    }, err => {
        alert("Não foi possível obter sua localização: " + err.message);
        btn.textContent = "📍 Usar minha localização";
    }, { enableHighAccuracy: true });
});