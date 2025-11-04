// ================================
//  Conecta Vizinhos - Lojas
// ================================

// ELEMENTOS
const mapDiv = document.getElementById('map');
const btnLocate = document.getElementById('btnLocate');
const list = document.getElementById('storeList');
const title = document.getElementById('storeSectionTitle');

// ================================
//  MAPA (inicialmente invisível)
// ================================
const map = L.map('map').setView([-23.55, -46.63], 13);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '&copy; OpenStreetMap'
}).addTo(map);
mapDiv.style.display = "none";

let userMarker = null;
let storeMarkers = [];
let lojasCache = []; // cache local das lojas da API

const userIcon = L.icon({
  iconUrl: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png',
  iconSize: [24, 24],
  iconAnchor: [12, 24]
});
const shopIcon = L.icon({
  iconUrl: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
  iconSize: [24, 24],
  iconAnchor: [12, 24]
});

// ================================
//  RENDERIZA OS CARDS DE LOJAS
// ================================
function renderStores(stores) {
  list.innerHTML = '';
  storeMarkers.forEach(m => map.removeLayer(m));
  storeMarkers = [];

  if (!stores || stores.length === 0) {
    list.innerHTML = "<p style='text-align:center;'>Nenhuma loja encontrada.</p>";
    return;
  }

  title.style.display = "block";

  stores.forEach(s => {
    // marcador no mapa
    if (s.lat && s.lon) {
      const marker = L.marker([s.lat, s.lon], { icon: shopIcon }).addTo(map);
      marker.bindPopup(`<strong>${s.nome}</strong><br>${s.endereco}`);
      storeMarkers.push(marker);
    }

    // card visual
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
        <p class="descricao">${s.descricao || ""}</p>
        <div class="bottom-row">
          <div class="categoria">${s.categoria}</div>
          <a class="ver-mais" href="javascript:void(0)" onclick="openImage('${s.imagem}')">Ver mais</a>
        </div>
      </div>
    `;
    list.appendChild(card);
  });
}

// ================================
//  MODAL DE IMAGEM
// ================================
function openImage(url) {
  const modal = document.getElementById('imageModal');
  const img = document.getElementById('modalImg');
  img.src = url;
  modal.classList.add('active');
}

// ================================
//  BUSCAR LOJAS DA API
// ================================
async function carregarLojas() {
  try {
    const res = await fetch('http://localhost:3000/lojas');
    if (!res.ok) throw new Error(`Erro HTTP: ${res.status}`);
    const data = await res.json();

    lojasCache = data; // salva no cache para filtros
    renderStores(data);
  } catch (err) {
    console.error("❌ Erro na API:", err);
    list.innerHTML = `
      <div style="text-align:center; padding:20px; color:#c00;">
        ⚠️ Erro ao carregar as lojas.<br>
        <small>${err.message}</small>
      </div>
    `;
  }
}

// ================================
//  PESQUISA POR NOME
// ================================
const searchInput = document.getElementById('searchInput');

if (searchInput) {
  searchInput.addEventListener('input', async (e) => {
    const valor = e.target.value.trim();

    // se o campo estiver vazio, mostra todas
    if (valor === "") {
      renderStores(lojasCache);
      return;
    }

    try {
      const res = await fetch(`http://localhost:3000/lojas?nome=${encodeURIComponent(valor)}`);
      if (!res.ok) throw new Error(`Erro HTTP: ${res.status}`);
      const data = await res.json();
      renderStores(data);
    } catch (err) {
      console.error("❌ Erro na pesquisa:", err);
    }
  });
}

// ================================
//  BOTÃO LOCALIZAÇÃO
// ================================
btnLocate.addEventListener('click', () => {
  if (!navigator.geolocation) {
    alert("Seu navegador não suporta geolocalização.");
    return;
  }

  btnLocate.textContent = "Localizando...";

  navigator.geolocation.getCurrentPosition(
    pos => {
      const { latitude, longitude } = pos.coords;

      mapDiv.style.display = "block";
      setTimeout(() => map.invalidateSize(), 100);

      if (userMarker) map.removeLayer(userMarker);
      userMarker = L.marker([latitude, longitude], { icon: userIcon })
        .addTo(map)
        .bindPopup("Você está aqui")
        .openPopup();

      map.setView([latitude, longitude], 15);
      carregarLojas();

      btnLocate.textContent = "📍 Usar minha localização";
    },
    err => {
      alert("Não foi possível obter sua localização: " + err.message);
      btnLocate.textContent = "📍 Usar minha localização";
    },
    { enableHighAccuracy: true }
  );
});

// ================================
//  FILTROS
// ================================
document.getElementById('btnFilter').addEventListener('click', () => {
  const categoria = document.getElementById('filterCategory').value;
  const avaliacaoMin = parseFloat(document.getElementById('filterRating').value);
  const horario = document.getElementById('filterHorario').value;

  if (!lojasCache || lojasCache.length === 0) {
    alert("Nenhuma loja carregada ainda!");
    return;
  }

  const agora = new Date();
  const horaAtual = agora.getHours();

  const filtradas = lojasCache.filter(loja => {
    // Filtro por categoria
    const categoriaOk = categoria === "todas" || loja.categoria === categoria;

    // Filtro por avaliação (se existir no JSON)
    const avaliacaoOk = !loja.avaliacao || loja.avaliacao >= avaliacaoMin;

    // Filtro por horário (se loja tiver campos "abre" e "fecha")
    let horarioOk = true;
    if (horario === "aberto" && loja.abre && loja.fecha) {
      const abre = parseInt(loja.abre.split(":")[0]);
      const fecha = parseInt(loja.fecha.split(":")[0]);
      horarioOk = horaAtual >= abre && horaAtual < fecha;
    } else if (horario === "fechado" && loja.abre && loja.fecha) {
      const abre = parseInt(loja.abre.split(":")[0]);
      const fecha = parseInt(loja.fecha.split(":")[0]);
      horarioOk = horaAtual < abre || horaAtual >= fecha;
    }

    return categoriaOk && avaliacaoOk && horarioOk;
  });

  renderStores(filtradas);
});

// ================================
//  INICIALIZAÇÃO
// ================================
carregarLojas();
