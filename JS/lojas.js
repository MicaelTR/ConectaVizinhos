// ================================
//  Conecta Vizinhos - Lojas
// ================================

// ELEMENTOS
const map = L.map("map").setView([-23.55052, -46.633308], 13);
const list = document.getElementById("storeList");
const spinner = document.getElementById("loadingSpinner");
const title = document.getElementById("storeSectionTitle");

// ================================
//  MAPA LEAFLET
// ================================
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: '© OpenStreetMap',
}).addTo(map);

// ================================
//  DADOS FICTÍCIOS DE LOJAS
// ================================
const fakeStores = [
  {
    nome: "Padaria Pão da Vila",
    categoria: "Padaria",
    endereco: "Rua das Flores, 123",
    avaliacao: 4.8,
    horario: { abre: 6, fecha: 20 },
    imagem: "../IMAGENS/loja1.jpg",
  },
  {
    nome: "Mercadinho São José",
    categoria: "Mercado",
    endereco: "Av. Central, 456",
    avaliacao: 4.5,
    horario: { abre: 8, fecha: 22 },
    imagem: "../IMAGENS/loja2.jpg",
  },
  {
    nome: "Farmácia Popular",
    categoria: "Farmácia",
    endereco: "Rua das Palmeiras, 77",
    avaliacao: 4.9,
    horario: { abre: 7, fecha: 23 },
    imagem: "../IMAGENS/loja3.jpg",
  },
];

// ================================
//  FUNÇÃO DE HORÁRIO
// ================================
function estaAberta(loja, hora = new Date()) {
  const h = hora.getHours();
  return h >= loja.horario.abre && h < loja.horario.fecha;
}

// ================================
//  RENDERIZA AS LOJAS
// ================================
function renderStores(lojas) {
  list.innerHTML = "";

  if (lojas.length === 0) {
    list.innerHTML = "<p style='text-align:center;'>Nenhuma loja encontrada.</p>";
    return;
  }

  lojas.forEach((loja) => {
    const aberta = estaAberta(loja);
    const card = document.createElement("div");
    card.className = "store-card";

    card.innerHTML = `
      <img src="${loja.imagem}" alt="${loja.nome}" onclick="abrirModal('${loja.imagem}')">
      <h3>${loja.nome}</h3>
      <p>${loja.endereco}</p>
      <p><strong>Categoria:</strong> ${loja.categoria}</p>
      <p><strong>Avaliação:</strong> ⭐ ${loja.avaliacao}</p>
      <p class="${aberta ? "aberta" : "fechada"}">${aberta ? "Aberta agora" : "Fechada"}</p>
    `;
    list.appendChild(card);
  });

  title.style.display = "block";
}

// ================================
//  EFEITOS DE TRANSIÇÃO
// ================================
function fadeOutList(callback) {
  list.style.opacity = 0;
  setTimeout(callback, 300);
}

function fadeInList() {
  list.style.opacity = 1;
}

// ================================
//  BOTÃO LOCALIZAÇÃO
// ================================
document.getElementById("btnLocate").addEventListener("click", () => {
  if (!navigator.geolocation) {
    alert("Seu navegador não suporta geolocalização.");
    return;
  }

  fadeOutList(() => {
    list.style.display = "none";
    spinner.style.display = "flex";

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        map.setView([latitude, longitude], 15);

        // marcador do usuário
        L.marker([latitude, longitude]).addTo(map)
          .bindPopup("Você está aqui!")
          .openPopup();

        // simula carregamento das lojas
        setTimeout(() => {
          spinner.style.display = "none";
          list.style.display = "grid";
          renderStores(fakeStores);
          fadeInList();
        }, 1000);
      },
      () => {
        spinner.style.display = "none";
        alert("Não foi possível obter sua localização.");
      }
    );
  });
});

// ================================
//  MODAL DE IMAGEM
// ================================
function abrirModal(src) {
  const modal = document.getElementById("imageModal");
  const img = document.getElementById("modalImg");
  img.src = src;
  modal.classList.add("active");
}

// ================================
//  INICIALIZAÇÃO
// ================================
renderStores(fakeStores);
