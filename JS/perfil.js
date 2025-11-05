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
let carrinho = []; // Array do carrinho

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
    document.getElementById("motoboy").textContent = loja.motoboy
      ? "🛵 Possui motoboy próprio"
      : "🚫 Não possui motoboy próprio";

    lojaTelefone = loja.telefone || "";

    carregarProdutos();
  } catch (err) {
    console.error("Erro ao carregar loja:", err);
    document.body.innerHTML = "<p>Erro ao carregar dados da loja.</p>";
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

    produtos.forEach((prod, index) => {
      const card = document.createElement("div");
      card.className = "card-produto";
      card.innerHTML = `
        <img src="${prod.imagem || 'https://via.placeholder.com/400x300?text=Sem+Imagem'}" alt="${prod.nome}">
        <div class="conteudo">
          <h3>${prod.nome}</h3>
          <p>${prod.descricao || "Produto da loja"}</p>
          <p class="preco">R$ ${prod.preco.toFixed(2)}</p>
          <button class="btn-comprar" onclick="adicionarAoCarrinho(${index})">Adicionar ao carrinho</button>
        </div>
      `;
      container.appendChild(card);
    });

    // Armazena produtos para uso no carrinho
    window.produtosLoja = produtos;

  } catch (err) {
    console.error("Erro ao carregar produtos:", err);
  }
}

// === FUNÇÕES DO CARRINHO ===
function adicionarAoCarrinho(index) {
  const produto = window.produtosLoja[index];

  // Verifica se já existe no carrinho
  const existente = carrinho.find(item => item.nome === produto.nome);
  if (existente) {
    existente.quantidade += 1;
  } else {
    carrinho.push({ ...produto, quantidade: 1 });
  }

  atualizarContador();
  alert(`${produto.nome} adicionado ao carrinho!`);
}

function atualizarContador() {
  const contador = document.getElementById("contador-carrinho");
  const total = carrinho.reduce((acc, item) => acc + item.quantidade, 0);
  contador.textContent = total;
}

// === MODAL DO CARRINHO ===
function abrirCarrinho() {
  const modal = document.getElementById("modalCarrinho");
  const itensContainer = document.getElementById("itensCarrinho");
  const totalEl = document.getElementById("totalCarrinho");

  itensContainer.innerHTML = "";

  if (carrinho.length === 0) {
    itensContainer.innerHTML = "<p>Seu carrinho está vazio.</p>";
    totalEl.textContent = "Total: R$ 0,00";
  } else {
    carrinho.forEach((item, idx) => {
      const div = document.createElement("div");
      div.className = "item-carrinho";
      div.innerHTML = `
      <img src="${item.imagem || 'https://via.placeholder.com/120'}" alt="${item.nome}">
      <div class="info-produto">
        <span class="nome-produto">${item.nome}</span>
        <span class="preco-produto">R$ ${item.preco.toFixed(2)}</span>
        <div class="quantidade-produto">
          <button onclick="alterarQuantidade(${idx}, -1)">-</button>
          <span>${item.quantidade}</span>
          <button onclick="alterarQuantidade(${idx}, 1)">+</button>
        </div>
        <span class="remover-produto" onclick="removerItem(${idx})">🗑️</span>
      </div>
      `;

      itensContainer.appendChild(div);
    });

    const total = carrinho.reduce((acc, item) => acc + item.preco * item.quantidade, 0);
    totalEl.textContent = `Total: R$ ${total.toFixed(2)}`;
  }

  modal.style.display = "flex";
}

function fecharCarrinho() {
  document.getElementById("modalCarrinho").style.display = "none";
}

function alterarQuantidade(idx, delta) {
  carrinho[idx].quantidade += delta;
  if (carrinho[idx].quantidade <= 0) {
    carrinho.splice(idx, 1);
  }
  atualizarContador();
  abrirCarrinho(); // Atualiza modal
}

function removerItem(idx) {
  carrinho.splice(idx, 1);
  atualizarContador();
  abrirCarrinho();
}

// === FINALIZAR PEDIDO ===
function finalizarPedido() {
  if (carrinho.length === 0) {
    alert("Seu carrinho está vazio!");
    return;
  }

  if (!lojaTelefone || lojaTelefone.trim() === "") {
    alert("Esta loja ainda não possui WhatsApp cadastrado.");
    return;
  }

  const nomeLoja = document.getElementById("nome").textContent || "sua loja";

  let mensagem = `Olá ${nomeLoja}! Gostaria de fazer o pedido:\n\n`;
  carrinho.forEach(item => {
    mensagem += `- ${item.nome} x ${item.quantidade}\n`;
  });
  const total = carrinho.reduce((acc, item) => acc + item.preco * item.quantidade, 0);
  mensagem += `\nTotal: R$ ${total.toFixed(2)}`;

  const url = `https://wa.me/${lojaTelefone}?text=${encodeURIComponent(mensagem)}`;
  window.open(url, "_blank");

  // Limpa o carrinho
  carrinho = [];
  atualizarContador();
  fecharCarrinho();
}

// === INICIALIZAÇÃO ===
carregarLoja();
