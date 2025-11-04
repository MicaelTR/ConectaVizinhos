// === MENU RESPONSIVO ===
const menuToggle = document.getElementById('menu-toggle');
const nav = document.getElementById('nav');

menuToggle.addEventListener('click', () => {
  nav.classList.toggle('open');
  menuToggle.classList.toggle('active');
});

// === API BASE ===
const API_URL = "http://localhost:3000";

// === PEGA O ID DA LOJA DA URL ===
const params = new URLSearchParams(window.location.search);
const lojaId = params.get("id");

let lojaTelefone = "";
let produtoSelecionado = "";

// === CARREGAR INFORMAÇÕES DA LOJA ===
async function carregarLoja() {
  if (!lojaId) {
    document.body.innerHTML = "<p>Loja não encontrada.</p>";
    return;
  }

  try {
    const res = await fetch(`${API_URL}/lojas/${lojaId}`);
    const loja = await res.json();

    document.getElementById("banner").src = loja.banner;
    document.getElementById("logo").src = loja.logo;
    document.getElementById("nome").textContent = loja.nome;
    document.getElementById("descricao").textContent = loja.descricao;
    document.getElementById("endereco").textContent = `📍 ${loja.endereco}`;
    document.getElementById("horario").textContent = `🕒 ${loja.abre} - ${loja.fecha}`;
    document.getElementById("motoboy").textContent = loja.motoboy ? "🛵 Possui motoboy próprio" : "🚫 Não possui motoboy próprio";

    lojaTelefone = loja.telefone || ""; // Salva telefone da loja
    carregarProdutos();
  } catch (err) {
    console.error("Erro ao carregar loja:", err);
  }
}

// === CARREGAR PRODUTOS DA LOJA ===
async function carregarProdutos() {
  try {
    const res = await fetch(`${API_URL}/lojas/${lojaId}/produtos`);
    const produtos = await res.json();
    const container = document.getElementById("lista-produtos");
    container.innerHTML = "";

    if (produtos.length === 0) {
      container.innerHTML = "<p>Nenhum produto disponível no momento.</p>";
      return;
    }

    produtos.forEach(prod => {
      const card = document.createElement("div");
      card.className = "card-produto";
      card.innerHTML = `
        <img src="https://source.unsplash.com/400x300/?${encodeURIComponent(prod.nome)}" alt="${prod.nome}">
        <div class="conteudo">
          <h3>${prod.nome}</h3>
          <p>${prod.descricao || "Produto da loja"}</p>
          <p class="preco">R$ ${prod.preco.toFixed(2)}</p>
          <button class="btn-comprar" onclick="abrirModal('${prod.nome}')">Comprar</button>
        </div>
      `;
      container.appendChild(card);
    });
  } catch (err) {
    console.error("Erro ao carregar produtos:", err);
  }
}

// === MODAL DE COMPRA ===
function abrirModal(produto) {
  produtoSelecionado = produto;
  const modal = document.getElementById("modalCompra");
  const msg = document.getElementById("mensagemModal");

  msg.innerText = `Olá! Gostaria de comprar o produto ${produto}. Deseja confirmar o pedido?`;
  modal.style.display = "flex";
}

function fecharModal() {
  document.getElementById("modalCompra").style.display = "none";
}

function confirmarCompra() {
  if (!lojaTelefone) {
    alert("Número da loja não disponível.");
    return;
  }

  const mensagem = encodeURIComponent(`Olá! Gostaria de comprar o produto ${produtoSelecionado}.`);
  window.open(`https://wa.me/${lojaTelefone}?text=${mensagem}`, "_blank");
  fecharModal();
}

// === INICIALIZAÇÃO ===
carregarLoja();
