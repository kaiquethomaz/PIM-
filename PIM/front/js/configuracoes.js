let empresa = null;

function obterElemento(id) {
  return document.getElementById(id);
}

function definirTexto(id, valor) {
  const elemento = obterElemento(id);
  if (elemento) {
    elemento.innerText = valor;
  }
}

function definirMensagem(texto, tipo = "erro") {
  const mensagem = obterElemento("mensagemConfiguracoes");
  if (!mensagem) {
    return;
  }

  mensagem.innerText = texto;
  mensagem.style.color = tipo === "sucesso" ? "#15803d" : "#c62828";
}

function formatarDataHora(dataIso) {
  if (!dataIso) {
    return "Nao informado";
  }

  const data = new Date(dataIso);
  if (Number.isNaN(data.getTime())) {
    return "Nao informado";
  }

  return data.toLocaleString("pt-BR");
}

function carregarEmpresaLocal() {
  const dados = localStorage.getItem("empresaCadastrada");

  if (!dados) {
    empresa = {
      empresa: localStorage.getItem("nomeComercio") || "NexaFlow",
      email: ""
    };
    return;
  }

  try {
    empresa = JSON.parse(dados);
  } catch {
    empresa = {
      empresa: localStorage.getItem("nomeComercio") || "NexaFlow",
      email: ""
    };
  }
}

function preencherFormularioEmpresa() {
  carregarEmpresaLocal();

  obterElemento("empresa").value = empresa?.empresa || localStorage.getItem("nomeComercio") || "";
  obterElemento("emailEmpresa").value = empresa?.email || "";

  definirTexto("infoNomeComercio", empresa?.empresa || localStorage.getItem("nomeComercio") || "-");
  definirTexto("infoEmailEmpresa", empresa?.email || "-");
}

function preencherResumoSessao() {
  const perfil = localStorage.getItem("perfilUsuario") || "admin";
  const usuarioNome = localStorage.getItem("usuarioNome") || "Nao identificado";
  const usuarioEmail = localStorage.getItem("usuarioEmail") || "Nao informado";
  const apiBase = localStorage.getItem("apiBase") || "http://localhost:5000";
  const tokenExpiraEm = localStorage.getItem("authExpiresAtUtc");

  const perfilFormatado = perfil === "admin"
    ? "Administrador"
    : perfil === "funcionario"
      ? "Funcionario"
      : perfil;

  definirTexto("resumoPerfil", perfilFormatado);
  definirTexto("infoUsuarioAtual", usuarioNome);
  definirTexto("infoEmailUsuario", usuarioEmail);
  definirTexto("infoApiBase", apiBase);
  definirTexto("infoExpiracaoToken", formatarDataHora(tokenExpiraEm));
}

async function carregarResumoOperacional() {
  try {
    const requisicoes = [
      apiFetch("/api/products"),
      apiFetch("/api/movements"),
      apiFetch("/api/users")
    ];

    const [produtosResponse, movimentosResponse, usuariosResponse] = await Promise.all(requisicoes);

    if (produtosResponse.status === 401 || produtosResponse.status === 403) {
      logout();
      return;
    }

    const produtos = produtosResponse.ok ? await produtosResponse.json() : [];
    const movimentos = movimentosResponse.ok ? await movimentosResponse.json() : [];

    let usuarios = [];
    if (usuariosResponse.ok) {
      usuarios = await usuariosResponse.json();
    }

    definirTexto("resumoProdutosConfig", String(produtos.length));
    definirTexto("resumoMovimentosConfig", String(movimentos.length));
    definirTexto("resumoUsuariosConfig", String(usuarios.length));
    definirTexto("resumoStatusApi", "API conectada");
  } catch {
    definirTexto("resumoStatusApi", "Conexao instavel");
    definirMensagem("Nao foi possivel atualizar os indicadores do ambiente.");
    definirTexto("resumoProdutosConfig", "-");
    definirTexto("resumoMovimentosConfig", "-");
    definirTexto("resumoUsuariosConfig", "-");
  }
}

function salvarEmpresa() {
  carregarEmpresaLocal();

  empresa.empresa = obterElemento("empresa").value.trim();
  empresa.email = obterElemento("emailEmpresa").value.trim();

  if (!empresa.empresa || !empresa.email) {
    definirMensagem("Preencha o nome da empresa e o e-mail principal.");
    return;
  }

  localStorage.setItem("empresaCadastrada", JSON.stringify(empresa));
  localStorage.setItem("nomeComercio", empresa.empresa);

  if (obterElemento("nomeComercio")) {
    obterElemento("nomeComercio").innerText = empresa.empresa;
  }

  definirTexto("infoNomeComercio", empresa.empresa);
  definirTexto("infoEmailEmpresa", empresa.email);
  definirMensagem("Dados da empresa atualizados com sucesso.", "sucesso");
}

function limparVendas() {
  localStorage.removeItem("vendas");
  definirMensagem("Cache local de vendas removido.", "sucesso");
}

function limparEstoque() {
  localStorage.removeItem("produtos");
  definirMensagem("Cache local de estoque removido.", "sucesso");
}

preencherFormularioEmpresa();
preencherResumoSessao();
carregarResumoOperacional();
