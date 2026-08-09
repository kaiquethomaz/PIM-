let produtos = [];
let movimentos = [];
let vendas = [];

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

function formatarDataHora(valor) {
  if (!valor) {
    return "-";
  }

  const data = new Date(valor);
  if (Number.isNaN(data.getTime())) {
    return "-";
  }

  return data.toLocaleString("pt-BR");
}

function escapeHtml(valor) {
  const texto = String(valor ?? "");
  const mapa = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#39;"
  };

  return texto.replace(/[&<>"']/g, caractere => mapa[caractere]);
}

function obterPeriodoMovimentos(lista) {
  const datas = lista
    .map(item => new Date(item.dateUtc))
    .filter(data => !Number.isNaN(data.getTime()))
    .sort((a, b) => a - b);

  if (datas.length === 0) {
    return "Não informado";
  }

  return `${datas[0].toLocaleDateString("pt-BR")} a ${datas[datas.length - 1].toLocaleDateString("pt-BR")}`;
}

function obterResumoEstoque(lista) {
  const totalProdutos = lista.length;
  const totalItens = lista.reduce((total, item) => {
    return total + Number(item.quantity || 0);
  }, 0);
  const baixoEstoque = lista.filter(item => Number(item.quantity || 0) < 5).length;

  return { totalProdutos, totalItens, baixoEstoque };
}

function calcularResumoVendas(lista) {
  const totalVendido = lista.reduce((total, venda) => {
    return total + Number(venda.total || 0);
  }, 0);

  const qtdVendida = lista.reduce((total, venda) => {
    return total + Number(venda.quantidade || 0);
  }, 0);

  const ticketMedio = qtdVendida > 0 ? totalVendido / qtdVendida : 0;

  return { totalVendido, qtdVendida, ticketMedio };
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
      const codigo = produto?.id ?? mov.productId ?? "-";

      return {
        codigo,
        produto: mov.product || produto?.name || "-",
        data: new Date(mov.dateUtc).toLocaleDateString("pt-BR"),
        dataUtc: mov.dateUtc,
        responsavel: formatarResponsavel(mov.user, mov.userRole),
        total,
        pagamento: mov.paymentMethod || "—",
        quantidade: mov.quantity
      };
    });
}

function pagamentoMaisUsado(lista) {
  const contagem = {};
  lista.forEach(venda => {
    const forma = venda.pagamento && venda.pagamento !== "—" ? venda.pagamento : null;
    if (forma) {
      contagem[forma] = (contagem[forma] || 0) + 1;
    }
  });

  const ordenado = Object.entries(contagem).sort((a, b) => b[1] - a[1]);
  return ordenado.length ? ordenado[0][0] : "—";
}

function carregarRelatorios(vendas) {
  const resumo = calcularResumoVendas(vendas);

  document.getElementById("totalVendido").innerText = formatarMoeda(resumo.totalVendido);
  document.getElementById("qtdVendida").innerText = resumo.qtdVendida.toLocaleString("pt-BR");
  document.getElementById("pagamentoMaisUsado").innerText = pagamentoMaisUsado(vendas);

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
        <td class="nowrap">#${venda.codigo}</td>
        <td>${venda.produto}</td>
        <td>${venda.data}</td>
        <td>${venda.responsavel}</td>
        <td>${formatarMoeda(venda.total)}</td>
        <td>${badgePagamento(venda.pagamento)}</td>
        <td class="nowrap">${venda.quantidade}</td>
      </tr>
    `;
  });
}

async function gerarRelatorioPdf() {
  try {
    if (produtos.length === 0 && movimentos.length === 0) {
      await iniciarRelatorios();
    }
  } catch (error) {
    // A tela já trata o erro no carregamento principal.
  }

  const empresa = localStorage.getItem("nomeComercio") || "StockControl";
  const periodo = obterPeriodoMovimentos(movimentos);
  const dataGeracao = new Date().toLocaleString("pt-BR");
  const resumoVendas = calcularResumoVendas(vendas);
  const resumoEstoque = obterResumoEstoque(produtos);

  const vendasOrdenadas = [...vendas].sort((a, b) => new Date(b.dataUtc) - new Date(a.dataUtc));
  const movimentosOrdenados = [...movimentos].sort((a, b) => new Date(b.dateUtc) - new Date(a.dateUtc));

  const vendasRows = vendasOrdenadas.length
    ? vendasOrdenadas.map((venda, index) => `
      <tr>
        <td class="nowrap">${venda.codigo}</td>
        <td>${escapeHtml(venda.produto)}</td>
        <td>${escapeHtml(venda.data)}</td>
        <td>${escapeHtml(venda.responsavel)}</td>
        <td class="text-right nowrap">${formatarMoeda(Number(venda.total || 0))}</td>
        <td>${escapeHtml(venda.pagamento || "—")}</td>
        <td class="text-center nowrap">${Number(venda.quantidade || 0)}</td>
      </tr>
    `).join("")
    : `<tr><td colspan="7">Nenhuma venda registrada.</td></tr>`;

  const estoqueRows = produtos.length
    ? produtos.map(produto => {
      const quantidade = Number(produto.quantity || 0);
      const status = quantidade < 5 ? "Baixo" : "OK";
      const statusClasse = quantidade < 5 ? "badge-low" : "";

      return `
        <tr>
          <td>${escapeHtml(produto.name)}</td>
          <td>${escapeHtml(produto.category || "-")}</td>
          <td class="text-center">${quantidade}</td>
          <td class="text-right">${formatarMoeda(Number(produto.price || 0))}</td>
          <td class="${statusClasse}">${status}</td>
        </tr>
      `;
    }).join("")
    : `<tr><td colspan="5">Nenhum item em estoque.</td></tr>`;

  const movimentosRows = movimentosOrdenados.length
    ? movimentosOrdenados.map((mov, index) => `
      <tr>
        <td class="nowrap">${index + 1}</td>
        <td>${formatarDataHora(mov.dateUtc)}</td>
        <td>${isSaida(mov.type) ? "Saída" : "Entrada"}</td>
        <td>${escapeHtml(mov.product || "-")}</td>
        <td class="text-center nowrap">${Number(mov.quantity || 0)}</td>
        <td>${escapeHtml(formatarResponsavel(mov.user, mov.userRole))}</td>
      </tr>
    `).join("")
    : `<tr><td colspan="6">Nenhuma movimentação registrada.</td></tr>`;

  const pdfHtml = `
    <!DOCTYPE html>
    <html lang="pt-br">
    <head>
      <meta charset="UTF-8">
      <title>Relatório - ${escapeHtml(empresa)}</title>
      <style>
        :root {
          color-scheme: only light;
          --brand: #1f5bbf;
          --brand-dark: #0f2a6b;
          --brand-soft: #e8f0ff;
          --border: #e2e8f0;
        }
        * { box-sizing: border-box; }
        body {
          margin: 0;
          font-family: "Inter", "Segoe UI", Arial, sans-serif;
          color: #0f172a;
          background: #ffffff;
        }
        .container {
          padding: 28px 32px;
        }
        header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 18px;
          border-bottom: 2px solid var(--brand);
          padding-bottom: 16px;
          margin-bottom: 22px;
        }
        .brand {
          display: flex;
          flex-direction: column;
        }
        .brand-name {
          font-size: 18px;
          font-weight: 700;
          color: var(--brand-dark);
          margin-bottom: 2px;
        }
        .report-title {
          font-size: 18px;
          font-weight: 700;
          color: var(--brand-dark);
          margin-bottom: 4px;
        }
        .header-meta {
          text-align: right;
        }
        .subtitle {
          font-size: 12px;
          color: #64748b;
          margin-top: 4px;
        }
        .section {
          margin-top: 22px;
        }
        .section-title {
          font-size: 15px;
          margin: 0 0 10px;
          color: var(--brand-dark);
          padding-left: 8px;
          border-left: 3px solid var(--brand);
        }
        .kpis {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          margin-top: 10px;
        }
        .kpi {
          border: 1px solid var(--border);
          border-top: 3px solid var(--brand);
          border-radius: 12px;
          padding: 12px;
          background: #f8fbff;
        }
        .kpi-label {
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: #64748b;
        }
        .kpi-value {
          font-size: 18px;
          font-weight: 700;
          margin-top: 6px;
          color: var(--brand-dark);
        }
        .kpi-meta {
          font-size: 11px;
          color: #64748b;
          margin-top: 4px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          font-size: 11px;
        }
        th, td {
          border: 1px solid var(--border);
          padding: 8px 10px;
          text-align: left;
          vertical-align: top;
        }
        th {
          background: var(--brand-soft);
          font-weight: 600;
          color: var(--brand-dark);
        }
        .text-right { text-align: right; }
        .text-center { text-align: center; }
        .nowrap { white-space: nowrap; }
        .badge-low { color: #b91c1c; font-weight: 700; }
        .footer {
          margin-top: 18px;
          font-size: 10px;
          color: var(--brand-dark);
        }
        @page {
          size: A4;
          margin: 16mm;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <header>
          <div class="brand">
            <div class="brand-name">StockControl</div>
            <div class="subtitle">Empresa: ${escapeHtml(empresa)}</div>
          </div>
          <div class="header-meta">
            <div class="report-title">Relatório gerencial</div>
            <div class="subtitle">Período: ${escapeHtml(periodo)}</div>
            <div class="subtitle">Gerado em ${escapeHtml(dataGeracao)}</div>
          </div>
        </header>

        <section class="section">
          <div class="section-title">Resumo executivo</div>
          <div class="kpis">
            <div class="kpi">
              <div class="kpi-label">Total vendido</div>
              <div class="kpi-value">${formatarMoeda(resumoVendas.totalVendido)}</div>
              <div class="kpi-meta">Quantidade: ${resumoVendas.qtdVendida.toLocaleString("pt-BR")}</div>
            </div>
            <div class="kpi">
              <div class="kpi-label">Ticket médio</div>
              <div class="kpi-value">${formatarMoeda(resumoVendas.ticketMedio)}</div>
              <div class="kpi-meta">por item vendido</div>
            </div>
            <div class="kpi">
              <div class="kpi-label">Estoque</div>
              <div class="kpi-value">${resumoEstoque.totalItens.toLocaleString("pt-BR")} itens</div>
              <div class="kpi-meta">${resumoEstoque.totalProdutos.toLocaleString("pt-BR")} produtos</div>
            </div>
          </div>
          <div class="kpis">
            <div class="kpi">
              <div class="kpi-label">Itens abaixo do mínimo</div>
              <div class="kpi-value">${resumoEstoque.baixoEstoque.toLocaleString("pt-BR")}</div>
              <div class="kpi-meta">necessitam reposição</div>
            </div>
            <div class="kpi">
              <div class="kpi-label">Pagamento mais usado</div>
              <div class="kpi-value">${escapeHtml(pagamentoMaisUsado(vendas))}</div>
              <div class="kpi-meta">preferência dos clientes</div>
            </div>
            <div class="kpi">
              <div class="kpi-label">Movimentações</div>
              <div class="kpi-value">${movimentos.length.toLocaleString("pt-BR")}</div>
              <div class="kpi-meta">registros no período</div>
            </div>
          </div>
        </section>

        <section class="section">
          <div class="section-title">Vendas registradas</div>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Produto</th>
                <th>Data</th>
                <th>Responsável</th>
                <th class="text-right">Total</th>
                <th>Pagamento</th>
                <th class="text-center">Qtd.</th>
              </tr>
            </thead>
            <tbody>
              ${vendasRows}
            </tbody>
          </table>
        </section>

        <section class="section">
          <div class="section-title">Estoque atual</div>
          <table>
            <thead>
              <tr>
                <th>Produto</th>
                <th>Categoria</th>
                <th class="text-center">Qtd.</th>
                <th class="text-right">Preço</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${estoqueRows}
            </tbody>
          </table>
        </section>

        <section class="section">
          <div class="section-title">Movimentações registradas</div>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Data</th>
                <th>Tipo</th>
                <th>Produto</th>
                <th class="text-center">Qtd.</th>
                <th>Responsável</th>
              </tr>
            </thead>
            <tbody>
              ${movimentosRows}
            </tbody>
          </table>
        </section>

        <div class="footer">Relatório gerado pelo StockControl.</div>
      </div>
    </body>
    </html>
  `;

  const janela = window.open("", "_blank");
  if (!janela) {
    alert("Permita pop-ups para gerar o PDF.");
    return;
  }

  janela.document.write(pdfHtml);
  janela.document.close();
  janela.focus();
  janela.print();
  janela.onafterprint = () => janela.close();
}

async function iniciarRelatorios() {
  try {
    const [produtosApi, movimentosApi] = await Promise.all([
      carregarProdutos(),
      carregarMovimentos()
    ]);

    produtos = produtosApi || [];
    movimentos = movimentosApi || [];

    vendas = mapearVendas();
    carregarRelatorios(vendas);
  } catch (error) {
    produtos = [];
    movimentos = [];
    vendas = [];
    carregarRelatorios([]);
  }
}

iniciarRelatorios();
