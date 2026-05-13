let produtos = [];
let movimentos = [];

function limparSessao() {
  localStorage.removeItem("perfilUsuario");
  localStorage.removeItem("authToken");
  localStorage.removeItem("authExpiresAtUtc");
  localStorage.removeItem("usuarioNome");
  localStorage.removeItem("usuarioEmail");
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

function mapearVendas() {
  const produtosMap = new Map(produtos.map(produto => [produto.id, produto]));

  return movimentos
    .filter(mov => isSaida(mov.type))
    .map(mov => {
      const produto = produtosMap.get(mov.productId);
      const total = produto ? Number(produto.price) * Number(mov.quantity) : 0;

      return {
        produto: mov.product || produto?.name || "-",
        data: new Date(mov.dateUtc).toLocaleDateString("pt-BR"),
        responsavel: formatarResponsavel(mov.user, mov.userRole),
        total,
        pagamento: "—",
        quantidade: mov.quantity
      };
    });
}

function carregarRelatorios(vendas) {
  const totalVendido = vendas.reduce((total, venda) => {
    return total + Number(venda.total || 0);
  }, 0);

  const qtdVendida = vendas.reduce((total, venda) => {
    return total + Number(venda.quantidade || 0);
  }, 0);

  document.getElementById("totalVendido").innerText = formatarMoeda(totalVendido);
  document.getElementById("qtdVendida").innerText = qtdVendida.toLocaleString("pt-BR");
  document.getElementById("pagamentoMaisUsado").innerText = "—";

  const tabela = document.getElementById("tabelaRelatorios");
  tabela.innerHTML = "";

  if (vendas.length === 0) {
    tabela.innerHTML = `
      <tr>
        <td colspan="7">Nenhuma venda registrada.</td>
      </tr>
    `;
    return;
  }

  vendas.forEach((venda, index) => {
    tabela.innerHTML += `
      <tr>
        <td>#${index + 1}</td>
        <td>${venda.produto}</td>
        <td>${venda.data}</td>
        <td>${venda.responsavel}</td>
        <td>${formatarMoeda(venda.total)}</td>
        <td>${venda.pagamento}</td>
        <td>${venda.quantidade}</td>
      </tr>
    `;
  });
}

async function iniciarRelatorios() {
  try {
    const [produtosApi, movimentosApi] = await Promise.all([
      carregarProdutos(),
      carregarMovimentos()
    ]);

    produtos = produtosApi || [];
    movimentos = movimentosApi || [];

    const vendas = mapearVendas();
    carregarRelatorios(vendas);
  } catch (error) {
    carregarRelatorios([]);
  }
}

iniciarRelatorios();
