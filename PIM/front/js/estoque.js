let produtos = [];

const perfil = localStorage.getItem("perfilUsuario");

function limparSessao() {
  localStorage.removeItem("perfilUsuario");
  localStorage.removeItem("authToken");
  localStorage.removeItem("authExpiresAtUtc");
  localStorage.removeItem("usuarioNome");
  localStorage.removeItem("usuarioEmail");
}

function statusProduto(qtd) {
  if (qtd <= 5) return "baixo";
  if (qtd <= 10) return "medio";
  return "ok";
}

function formatarMoeda(valor) {
  return valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

async function carregarProdutos() {
  const resposta = await apiFetch("/api/products");

  if (resposta.status === 401 || resposta.status === 403) {
    limparSessao();
    window.location.href = "login.html";
    return [];
  }

  if (!resposta.ok) {
    throw new Error("Falha ao carregar produtos.");
  }

  return await resposta.json();
}

function renderizarEstoque(lista) {
  const tabela = document.getElementById("tabelaEstoque");
  tabela.innerHTML = "";

  if (lista.length === 0) {
    tabela.innerHTML = `
      <tr>
        <td colspan="6">Nenhum produto encontrado.</td>
      </tr>
    `;
    return;
  }

  lista.forEach(produto => {
    const status = statusProduto(Number(produto.quantity));

    tabela.innerHTML += `
      <tr>
        <td>${produto.name}</td>
        <td>${produto.category}</td>
        <td>#${produto.id}</td>
        <td>${formatarMoeda(Number(produto.price))}</td>
        <td><span class="status ${status}"></span></td>
        <td class="acoes">
          ${perfil !== "funcionario" ? `
            <span class="material-icons" onclick="editarProduto(${produto.id})">edit</span>
            <span class="material-icons" onclick="excluirProduto(${produto.id})">delete</span>
          ` : `
            <span class="sem-permissao">Sem permissão</span>
          `}
        </td>
      </tr>
    `;
  });
}

function atualizarResumoEstoque() {
  const totalProdutos = produtos.length;
  const totalItens = produtos.reduce((total, produto) => {
    return total + Number(produto.quantity || 0);
  }, 0);

  const baixoEstoque = produtos.filter(produto => {
    return statusProduto(Number(produto.quantity)) === "baixo";
  }).length;

  const totalProdutosEl = document.getElementById("resumoProdutos");
  const totalItensEl = document.getElementById("resumoItens");
  const baixoEl = document.getElementById("resumoBaixo");

  if (totalProdutosEl) {
    totalProdutosEl.innerText = totalProdutos.toLocaleString("pt-BR");
  }

  if (totalItensEl) {
    totalItensEl.innerText = totalItens.toLocaleString("pt-BR");
  }

  if (baixoEl) {
    baixoEl.innerText = baixoEstoque.toLocaleString("pt-BR");
  }
}

function carregarCategorias() {
  const select = document.getElementById("filtroCategoria");
  select.innerHTML = `<option value="">Categoria</option>`;

  const categorias = [...new Set(produtos.map(p => p.category))];

  categorias.forEach(cat => {
    select.innerHTML += `<option value="${cat}">${cat}</option>`;
  });
}

function filtrarEstoque() {
  const busca = document.getElementById("busca").value.toLowerCase();
  const categoria = document.getElementById("filtroCategoria").value;
  const status = document.getElementById("filtroStatus").value;

  const filtrados = produtos.filter(p => {
    const nomeOk = p.name.toLowerCase().includes(busca);
    const categoriaOk = categoria === "" || p.category === categoria;
    const statusOk = status === "" || statusProduto(Number(p.quantity)) === status;

    return nomeOk && categoriaOk && statusOk;
  });

  renderizarEstoque(filtrados);
  atualizarResumoEstoque();
}

function editarProduto(id) {
  window.location.href = `cadastro-produto.html?id=${id}`;
}

async function excluirProduto(id) {
  const resposta = await apiFetch(`/api/products/${id}`, { method: "DELETE" });

  if (resposta.status === 401 || resposta.status === 403) {
    limparSessao();
    window.location.href = "login.html";
    return;
  }

  if (!resposta.ok) {
    return;
  }

  await carregarDados();
}

async function carregarDados() {
  try {
    produtos = await carregarProdutos();
    renderizarEstoque(produtos);
    carregarCategorias();
    atualizarResumoEstoque();
  } catch (error) {
    renderizarEstoque([]);
    atualizarResumoEstoque();
  }
}

if (perfil === "funcionario") {
  document.getElementById("btnCadastrarProduto").style.display = "none";
}

carregarDados();
