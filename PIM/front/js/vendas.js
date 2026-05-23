let produtos = [];
let movimentos = [];
let vendas = [];

const selectProduto = document.getElementById("produto");

function limparSessao() {
  localStorage.removeItem("perfilUsuario");
  localStorage.removeItem("authToken");
  localStorage.removeItem("authExpiresAtUtc");
  localStorage.removeItem("usuarioNome");
  localStorage.removeItem("usuarioEmail");
}

function formatarMoeda(valor) {
  return valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

function isSaida(tipo) {
  return tipo === 2 || tipo === "Exit" || tipo === "saida";
}

function formatarResponsavel(usuario, role) {
  if (!usuario) {
    return "-";
  }

  if (role === 1 || role === "Admin" || role === "admin") {
    return `${usuario} (Administrador)`;
  }

  if (role === 2 || role === "Manager" || role === "manager") {
    return `${usuario} (Gerente)`;
  }

  if (role === 3 || role === "Employee" || role === "employee") {
    return `${usuario} (Funcionário)`;
  }

  return usuario;
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

async function carregarMovimentos() {
  const resposta = await apiFetch("/api/movements");

  if (resposta.status === 401 || resposta.status === 403) {
    limparSessao();
    window.location.href = "login.html";
    return [];
  }

  if (!resposta.ok) {
    throw new Error("Falha ao carregar movimentações.");
  }

  return await resposta.json();
}

function preencherSelectProdutos() {
  selectProduto.innerHTML = `<option value="">Selecione o produto</option>`;

  produtos.forEach(produto => {
    selectProduto.innerHTML += `
      <option value="${produto.id}">
        ${produto.name} - Estoque: ${produto.quantity}
      </option>
    `;
  });
}

function mapearVendas(movimentosLista) {
  const produtosMap = new Map(produtos.map(produto => [produto.id, produto]));

  return movimentosLista
    .filter(mov => isSaida(mov.type))
    .map(mov => {
      const produto = produtosMap.get(mov.productId);
      const total = produto ? Number(produto.price) * Number(mov.quantity) : 0;
      const codigo = produto?.id ?? mov.productId ?? "-";

      return {
        codigo,
        produto: mov.product || produto?.name || "-",
        data: new Date(mov.dateUtc).toLocaleDateString("pt-BR"),
        responsavel: formatarResponsavel(mov.user, mov.userRole),
        total,
        pagamento: "—",
        quantidade: mov.quantity
      };
    });
}

function renderizarVendas(lista) {
  const tabela = document.getElementById("tabelaVendas");
  tabela.innerHTML = "";

  if (lista.length === 0) {
    tabela.innerHTML = `
      <tr>
        <td colspan="7">Nenhuma venda registrada.</td>
      </tr>
    `;
    atualizarResumoVendas([]);
    return;
  }

  lista.forEach((venda, index) => {
    tabela.innerHTML += `
      <tr>
        <td class="nowrap">#${venda.codigo}</td>
        <td>${venda.produto}</td>
        <td>${venda.data}</td>
        <td>${venda.responsavel}</td>
        <td>${formatarMoeda(venda.total)}</td>
        <td>${venda.pagamento}</td>
        <td class="nowrap">${venda.quantidade}</td>
      </tr>
    `;
  });

  atualizarResumoVendas(lista);
}

function atualizarResumoVendas(lista) {
  const totalVendas = lista.length;
  const receita = lista.reduce((total, venda) => {
    return total + Number(venda.total || 0);
  }, 0);
  const ticketMedio = totalVendas > 0 ? receita / totalVendas : 0;

  const totalEl = document.getElementById("resumoTotalVendas");
  const receitaEl = document.getElementById("resumoReceita");
  const ticketEl = document.getElementById("resumoTicket");

  if (totalEl) {
    totalEl.innerText = totalVendas.toLocaleString("pt-BR");
  }

  if (receitaEl) {
    receitaEl.innerText = formatarMoeda(receita);
  }

  if (ticketEl) {
    ticketEl.innerText = formatarMoeda(ticketMedio);
  }
}

async function registrarVenda() {
  const produtoId = Number(selectProduto.value);
  const quantidade = Number(document.getElementById("quantidade").value);
  const pagamento = document.getElementById("pagamento").value;
  const erro = document.getElementById("erro");

  erro.innerText = "";

  if (!produtoId || !quantidade || !pagamento) {
    erro.innerText = "Preencha todos os campos.";
    return;
  }

  const produto = produtos.find(item => item.id === produtoId);

  if (!produto) {
    erro.innerText = "Produto inválido.";
    return;
  }

  if (quantidade <= 0) {
    erro.innerText = "Quantidade inválida.";
    return;
  }

  if (produto.quantity < quantidade) {
    erro.innerText = "Estoque insuficiente.";
    return;
  }

  const resposta = await apiFetch("/api/movements", {
    method: "POST",
    body: JSON.stringify({
      ProductId: produtoId,
      Type: 2,
      Quantity: quantidade
    })
  });

  if (resposta.status === 401 || resposta.status === 403) {
    limparSessao();
    window.location.href = "login.html";
    return;
  }

  if (!resposta.ok) {
    const erroApi = await resposta.json().catch(() => null);
    erro.innerText = erroApi?.message || "Não foi possível registrar a venda.";
    return;
  }

  document.getElementById("quantidade").value = "";
  document.getElementById("pagamento").value = "";

  await carregarDados();
}

async function carregarDados() {
  const erro = document.getElementById("erro");
  erro.innerText = "";

  try {
    const [produtosApi, movimentosApi] = await Promise.all([
      carregarProdutos(),
      carregarMovimentos()
    ]);

    produtos = produtosApi || [];
    movimentos = movimentosApi || [];
    vendas = mapearVendas(movimentos);

    preencherSelectProdutos();
    renderizarVendas(vendas);
  } catch (error) {
    renderizarVendas([]);
    erro.innerText = "Não foi possível carregar os dados de vendas.";
  }
}

carregarDados();
