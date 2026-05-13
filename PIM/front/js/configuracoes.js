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
  const perfilFormatado = perfil === "admin"
    ? "Administrador"
    : perfil === "funcionario"
      ? "Funcionario"
      : perfil;

  definirTexto("resumoPerfil", perfilFormatado);
}

async function carregarResumoOperacional() {
  try {
    const requisicoes = [apiFetch("/api/users")];

    const [usuariosResponse] = await Promise.all(requisicoes);

    if (usuariosResponse.status === 401 || usuariosResponse.status === 403) {
      logout();
      return;
    }

    let usuarios = [];
    if (usuariosResponse.ok) {
      usuarios = await usuariosResponse.json();
    }

    definirTexto("resumoUsuariosConfig", String(usuarios.length));
    definirTexto("resumoStatusApi", "API conectada");
  } catch {
    definirTexto("resumoStatusApi", "Conexao instavel");
    definirMensagem("Nao foi possivel atualizar os indicadores do ambiente.");
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
