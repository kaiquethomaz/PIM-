const meses = [
  "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
  "Jul", "Ago", "Set", "Out", "Nov", "Dez"
];

let movimentos = [];
let graficoEntradaSaida = null;
let graficoMaisVendidos = null;

function isEntrada(tipo) {
  return tipo === 1 || tipo === "Entry";
}

function isSaida(tipo) {
  return tipo === 2 || tipo === "Exit";
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

function obterPeriodo() {
  const select = document.getElementById("filtroPeriodo");
  return select ? select.value : "mensal";
}

function montarBuckets(periodo) {
  const agora = new Date();

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
    const anoAtual = agora.getUTCFullYear();

    for (let i = 4; i >= 0; i -= 1) {
      const ano = anoAtual - i;
      labels.push(String(ano));
      keys.push(String(ano));
    }

    return { labels, keys };
  }

  const labels = [];
  const keys = [];
  const anoAtual = agora.getUTCFullYear();
  const mesAtual = agora.getUTCMonth();

  for (let i = 11; i >= 0; i -= 1) {
    const data = new Date(Date.UTC(anoAtual, mesAtual - i, 1));
    const ano = data.getUTCFullYear();
    const mes = data.getUTCMonth();
    labels.push(`${meses[mes]}/${String(ano).slice(-2)}`);
    keys.push(`${ano}-${mes + 1}`);
  }

  return { labels, keys };
}

function calcularSerie(periodo) {
  const { labels, keys } = montarBuckets(periodo);
  const entradas = Array(labels.length).fill(0);
  const saidas = Array(labels.length).fill(0);
  const indicePorKey = new Map(keys.map((key, index) => [key, index]));

  movimentos.forEach(mov => {
    const data = new Date(mov.dateUtc);
    const ano = data.getUTCFullYear();
    const mes = data.getUTCMonth();
    let key;

    if (periodo === "trimestral") {
      const trimestre = Math.floor(mes / 3) + 1;
      key = `${ano}-Q${trimestre}`;
    } else if (periodo === "anual") {
      key = String(ano);
    } else {
      key = `${ano}-${mes + 1}`;
    }

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

  return { labels, entradas, saidas };
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
}

function filtrarDashboard() {
  atualizarGraficoEntradaSaida();
}

async function iniciarDashboard() {
  const erro = document.getElementById("erroDashboard");
  erro.innerText = "";

  try {
    const [movimentosApi, maisVendidosApi] = await Promise.all([
      carregarMovimentos(),
      carregarMaisVendidos()
    ]);

    movimentos = movimentosApi || [];
    atualizarGraficoMaisVendidos(maisVendidosApi || []);
    atualizarGraficoEntradaSaida();
  } catch (error) {
    erro.innerText = "Não foi possível carregar os dados do dashboard.";
  }
}

iniciarDashboard();
