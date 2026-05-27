const meses = [
  "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
  "Jul", "Ago", "Set", "Out", "Nov", "Dez"
];

let movimentos = [];
let produtos = [];
let graficoEntradaSaida = null;
let graficoMaisVendidos = null;
let graficoDemanda = null;
let graficoVendasPrev = null;
let graficoFaturamentoPrev = null;

const formatadorMoeda = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL"
});

function isEntrada(tipo) {
  const valor = String(tipo ?? "").toLowerCase();
  return tipo === 1 || valor === "1" || valor === "entry" || valor === "entrada";
}

function isSaida(tipo) {
  const valor = String(tipo ?? "").toLowerCase();
  return tipo === 2 || valor === "2" || valor === "exit" || valor === "saida";
}

function limparSessao() {
  localStorage.removeItem("perfilUsuario");
  localStorage.removeItem("authToken");
  localStorage.removeItem("authExpiresAtUtc");
  localStorage.removeItem("usuarioNome");
  localStorage.removeItem("usuarioEmail");
}

async function carregarMovimentos() {
  const resposta = await apiFetch("/api/reports/movements");

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

async function carregarMaisVendidos() {
  const resposta = await apiFetch("/api/reports/top-selling");

  if (resposta.status === 401 || resposta.status === 403) {
    limparSessao();
    window.location.href = "login.html";
    return [];
  }

  if (!resposta.ok) {
    throw new Error("Falha ao carregar mais vendidos.");
  }

  return await resposta.json();
}

async function carregarPrevisaoApi(endpoint) {
  const resposta = await apiFetch(endpoint);

  if (resposta.status === 401 || resposta.status === 403) {
    limparSessao();
    window.location.href = "login.html";
    return null;
  }

  if (!resposta.ok) {
    const erro = await resposta.json().catch(() => null);
    const mensagem = erro?.message || "Falha ao carregar previsão.";
    throw new Error(mensagem);
  }

  return await resposta.json();
}

async function carregarPrevisaoDemanda() {
  return await carregarPrevisaoApi("/api/reports/demand-forecast?days=7");
}

async function carregarPrevisaoVendas() {
  return await carregarPrevisaoApi("/api/reports/sales-forecast?days=7");
}

async function carregarPrevisaoFaturamento() {
  return await carregarPrevisaoApi("/api/reports/revenue-forecast?days=7");
}

function atualizarGraficoMaisVendidos(dados) {
  const nomesProdutos = dados.map(item => item.product);
  const qtdVendidos = dados.map(item => item.totalSold);
  const ctx = document.getElementById("graficoMaisVendidos");

  if (!graficoMaisVendidos) {
    graficoMaisVendidos = new Chart(ctx, {
      type: "bar",
      data: {
        labels: nomesProdutos,
        datasets: [{
          data: qtdVendidos,
          backgroundColor: "#0f5b7f"
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            display: false
          }
        },
        scales: {
          y: {
            beginAtZero: true
          }
        }
      }
    });
    return;
  }

  graficoMaisVendidos.data.labels = nomesProdutos;
  graficoMaisVendidos.data.datasets[0].data = qtdVendidos;
  graficoMaisVendidos.update();
}

function atualizarGraficoDemanda(dados) {
  const pontos = dados?.points || [];
  const labels = pontos.map(item => {
    const data = new Date(item.dateUtc);
    return data.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
  });
  const valores = pontos.map(item => item.forecast);

  const ctx = document.getElementById("graficoDemanda");
  if (!ctx) {
    return;
  }

  if (!graficoDemanda) {
    graficoDemanda = new Chart(ctx, {
      type: "line",
      data: {
        labels,
        datasets: [{
          label: "Demanda prevista",
          data: valores,
          borderColor: "#2563eb",
          backgroundColor: "rgba(37, 99, 235, 0.15)",
          fill: true,
          tension: 0.35,
          pointRadius: 3
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            display: false
          }
        },
        scales: {
          y: {
            beginAtZero: true
          }
        }
      }
    });
    return;
  }

  graficoDemanda.data.labels = labels;
  graficoDemanda.data.datasets[0].data = valores;
  graficoDemanda.update();
}

function atualizarGraficoPrevisaoVendas(dados) {
  const pontos = dados?.points || [];
  const labels = pontos.map(item => {
    const data = new Date(item.dateUtc);
    return data.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
  });
  const valores = pontos.map(item => item.forecast);

  const ctx = document.getElementById("graficoVendasPrev");
  if (!ctx) {
    return;
  }

  if (!graficoVendasPrev) {
    graficoVendasPrev = new Chart(ctx, {
      type: "line",
      data: {
        labels,
        datasets: [{
          label: "Vendas previstas",
          data: valores,
          borderColor: "#16a34a",
          backgroundColor: "rgba(22, 163, 74, 0.12)",
          fill: true,
          tension: 0.35,
          pointRadius: 3
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            display: false
          }
        },
        scales: {
          y: {
            beginAtZero: true
          }
        }
      }
    });
    return;
  }

  graficoVendasPrev.data.labels = labels;
  graficoVendasPrev.data.datasets[0].data = valores;
  graficoVendasPrev.update();
}

function atualizarGraficoPrevisaoFaturamento(dados) {
  const pontos = dados?.points || [];
  const labels = pontos.map(item => {
    const data = new Date(item.dateUtc);
    return data.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
  });
  const valores = pontos.map(item => item.forecast);

  const ctx = document.getElementById("graficoFaturamentoPrev");
  if (!ctx) {
    return;
  }

  if (!graficoFaturamentoPrev) {
    graficoFaturamentoPrev = new Chart(ctx, {
      type: "line",
      data: {
        labels,
        datasets: [{
          label: "Faturamento previsto",
          data: valores,
          borderColor: "#f59e0b",
          backgroundColor: "rgba(245, 158, 11, 0.12)",
          fill: true,
          tension: 0.35,
          pointRadius: 3
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            display: false
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: value => formatadorMoeda.format(value)
            }
          }
        }
      }
    });
    return;
  }

  graficoFaturamentoPrev.data.labels = labels;
  graficoFaturamentoPrev.data.datasets[0].data = valores;
  graficoFaturamentoPrev.update();
}

function obterPeriodo() {
  const select = document.getElementById("filtroPeriodo");
  return select ? select.value : "mensal";
}

function inicioSemanaUtc(data) {
  const copia = new Date(data.getFullYear(), data.getMonth(), data.getDate());
  const diaSemana = copia.getDay();
  const deslocamento = diaSemana === 0 ? -6 : 1 - diaSemana;
  copia.setDate(copia.getDate() + deslocamento);
  return copia;
}

function formatarLabelDia(data) {
  return data.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

function formatarLabelSemana(data) {
  const fimSemana = new Date(data);
  fimSemana.setDate(fimSemana.getDate() + 6);
  return `${formatarLabelDia(data)}-${formatarLabelDia(fimSemana)}`;
}

function formatarChaveLocal(data) {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const dia = String(data.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}

function obterBucketMovimento(data, periodo) {
  const ano = data.getFullYear();
  const mes = data.getMonth();

  if (periodo === "diario") {
    return `${ano}-${mes + 1}-${data.getDate()}`;
  }

  if (periodo === "semanal") {
    const inicioSemana = inicioSemanaUtc(data);
    return `W-${formatarChaveLocal(inicioSemana)}`;
  }

  if (periodo === "trimestral") {
    const trimestre = Math.floor(mes / 3) + 1;
    return `${ano}-Q${trimestre}`;
  }

  if (periodo === "anual") {
    return String(ano);
  }

  return `${ano}-${mes + 1}`;
}

function montarBuckets(periodo) {
  const agora = new Date();

  if (periodo === "diario") {
    const labels = [];
    const keys = [];

    for (let i = 13; i >= 0; i -= 1) {
      const data = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate() - i);
      labels.push(formatarLabelDia(data));
      keys.push(obterBucketMovimento(data, periodo));
    }

    return { labels, keys };
  }

  if (periodo === "semanal") {
    const labels = [];
    const keys = [];
    const semanaAtual = inicioSemanaUtc(agora);

    for (let i = 7; i >= 0; i -= 1) {
      const data = new Date(semanaAtual);
      data.setUTCDate(data.getUTCDate() - (i * 7));
      labels.push(formatarLabelSemana(data));
      keys.push(obterBucketMovimento(data, periodo));
    }

    return { labels, keys };
  }

  if (periodo === "trimestral") {
    const labels = [];
    const keys = [];
    const quarterAtual = Math.floor(agora.getUTCMonth() / 3) + 1;
    const base = agora.getUTCFullYear() * 4 + (quarterAtual - 1);

    for (let i = 3; i >= 0; i -= 1) {
      const total = base - i;
      const ano = Math.floor(total / 4);
      const trimestre = (total % 4) + 1;
      labels.push(`T${trimestre}/${ano}`);
      keys.push(`${ano}-Q${trimestre}`);
    }

    return { labels, keys };
  }

  if (periodo === "anual") {
    const labels = [];
    const keys = [];
    const anoAtual = agora.getFullYear();

    for (let i = 4; i >= 0; i -= 1) {
      const ano = anoAtual - i;
      labels.push(String(ano));
      keys.push(String(ano));
    }

    return { labels, keys };
  }

  const labels = [];
  const keys = [];
  const anoAtual = agora.getFullYear();
  const mesAtual = agora.getMonth();

  for (let i = 11; i >= 0; i -= 1) {
    const data = new Date(anoAtual, mesAtual - i, 1);
    const ano = data.getFullYear();
    const mes = data.getMonth();
    labels.push(`${meses[mes]}/${String(ano).slice(-2)}`);
    keys.push(`${ano}-${mes + 1}`);
  }

  return { labels, keys };
}

function filtrarMovimentosPorPeriodo(periodo, keys) {
  const keysSet = new Set(keys);
  return movimentos.filter(mov => {
    const data = new Date(mov.dateUtc);
    return keysSet.has(obterBucketMovimento(data, periodo));
  });
}

function atualizarResumoDashboard(movimentosLista) {
  const produtosMap = new Map(produtos.map(produto => [produto.id, produto]));

  const entradas = movimentosLista.reduce((total, mov) => {
    if (isEntrada(mov.type)) {
      return total + Number(mov.quantity || 0);
    }
    return total;
  }, 0);

  const saidas = movimentosLista.reduce((total, mov) => {
    if (isSaida(mov.type)) {
      return total + Number(mov.quantity || 0);
    }
    return total;
  }, 0);

  const saldoMovimentado = movimentosLista.reduce((total, mov) => {
    const produto = produtosMap.get(mov.productId);
    const preco = Number(produto?.price || 0);
    const valorMovimento = preco * Number(mov.quantity || 0);

    return total + valorMovimento;
  }, 0);

  const vendidosPorProduto = new Map();

  movimentosLista.forEach(mov => {
    if (!isSaida(mov.type)) {
      return;
    }

    const quantidadeAtual = vendidosPorProduto.get(mov.product) || 0;
    vendidosPorProduto.set(mov.product, quantidadeAtual + Number(mov.quantity || 0));
  });

  const top = [...vendidosPorProduto.entries()]
    .sort((a, b) => b[1] - a[1])[0] || null;

  const entradasEl = document.getElementById("resumoEntradas");
  const saidasEl = document.getElementById("resumoSaidas");
  const saldoEl = document.getElementById("resumoSaldo");
  const topEl = document.getElementById("resumoTopProduto");
  const topQtdEl = document.getElementById("resumoTopQtd");

  if (entradasEl) {
    entradasEl.innerText = entradas.toLocaleString("pt-BR");
  }

  if (saidasEl) {
    saidasEl.innerText = saidas.toLocaleString("pt-BR");
  }

  if (saldoEl) {
    saldoEl.innerText = formatadorMoeda.format(saldoMovimentado);
  }

  if (topEl) {
    topEl.innerText = top ? top[0] : "-";
  }

  if (topQtdEl) {
    topQtdEl.innerText = top ? `${top[1]} itens` : "0 itens";
  }
}

function calcularSerie(periodo) {
  const { labels, keys } = montarBuckets(periodo);
  const entradas = Array(labels.length).fill(0);
  const saidas = Array(labels.length).fill(0);
  const indicePorKey = new Map(keys.map((key, index) => [key, index]));

  movimentos.forEach(mov => {
    const data = new Date(mov.dateUtc);
    const key = obterBucketMovimento(data, periodo);

    const indice = indicePorKey.get(key);
    if (indice === undefined) {
      return;
    }

    if (isEntrada(mov.type)) {
      entradas[indice] += Number(mov.quantity);
    }

    if (isSaida(mov.type)) {
      saidas[indice] += Number(mov.quantity);
    }
  });

  const movimentosFiltrados = filtrarMovimentosPorPeriodo(periodo, keys);
  return { labels, entradas, saidas, movimentosFiltrados };
}

function atualizarGraficoEntradaSaida() {
  const periodo = obterPeriodo();
  const serie = calcularSerie(periodo);

  const ctx = document.getElementById("graficoEntradaSaida");

  if (!graficoEntradaSaida) {
    graficoEntradaSaida = new Chart(ctx, {
      type: "line",
      data: {
        labels: serie.labels,
        datasets: [
          {
            label: "Entrada",
            data: serie.entradas,
            borderColor: "#22c55e",
            backgroundColor: "transparent",
            tension: 0.4
          },
          {
            label: "Saída",
            data: serie.saidas,
            borderColor: "#ef4444",
            backgroundColor: "transparent",
            tension: 0.4
          }
        ]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            display: false
          }
        },
        scales: {
          y: {
            beginAtZero: true
          }
        }
      }
    });
  }

  graficoEntradaSaida.data.labels = serie.labels;
  graficoEntradaSaida.data.datasets[0].data = serie.entradas;
  graficoEntradaSaida.data.datasets[1].data = serie.saidas;
  graficoEntradaSaida.update();

  atualizarResumoDashboard(serie.movimentosFiltrados);
}

function filtrarDashboard() {
  atualizarGraficoEntradaSaida();
}

async function iniciarDashboard() {
  const erro = document.getElementById("erroDashboard");
  const erroForecast = document.getElementById("erroForecast");
  erro.innerText = "";
  if (erroForecast) {
    erroForecast.innerText = "";
  }

  try {
    const [movimentosApi, maisVendidosApi, produtosApi] = await Promise.all([
      carregarMovimentos(),
      carregarMaisVendidos(),
      carregarProdutos()
    ]);

    movimentos = movimentosApi || [];
    produtos = produtosApi || [];
    const maisVendidos = maisVendidosApi || [];

    atualizarGraficoMaisVendidos(maisVendidos);
    atualizarGraficoEntradaSaida();
  } catch (error) {
    erro.innerText = "Não foi possível carregar os dados do dashboard.";
  }

  const errosForecast = [];

  try {
    const previsaoApi = await carregarPrevisaoDemanda();
    if (previsaoApi) {
      atualizarGraficoDemanda(previsaoApi);
    }
  } catch (error) {
    errosForecast.push(error.message);
  }

  try {
    const previsaoVendas = await carregarPrevisaoVendas();
    if (previsaoVendas) {
      atualizarGraficoPrevisaoVendas(previsaoVendas);
    }
  } catch (error) {
    errosForecast.push(error.message);
  }

  try {
    const previsaoFaturamento = await carregarPrevisaoFaturamento();
    if (previsaoFaturamento) {
      atualizarGraficoPrevisaoFaturamento(previsaoFaturamento);
    }
  } catch (error) {
    errosForecast.push(error.message);
  }

  if (erroForecast && errosForecast.length > 0) {
    erroForecast.innerText = errosForecast.join(" ");
  }
}

iniciarDashboard();
