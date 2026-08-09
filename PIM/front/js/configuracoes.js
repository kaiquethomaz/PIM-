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

function definirStatusApi(texto, conectado) {
  const alvo = obterElemento("resumoStatusApi");
  if (!alvo) {
    return;
  }
  const classeDot = conectado ? "status-dot-online" : "status-dot-offline";
  alvo.innerHTML = `<span class="status-dot ${classeDot}"></span>${texto}`;
}

function definirMensagem(texto, tipo = "erro") {
  const mensagem = obterElemento("mensagemConfiguracoes");
  if (!mensagem) {
    return;
  }

  mensagem.innerText = texto;
  mensagem.style.color = tipo === "sucesso" ? "#15803d" : "#c62828";
}

function formatarPerfilUsuario(role) {
  if (role === 1 || role === "Admin" || role === "admin") {
    return "Administrador";
  }

  if (role === 2 || role === "Manager" || role === "manager") {
    return "Gerente";
  }

  if (role === 3 || role === "Employee" || role === "employee") {
    return "Funcionário";
  }

  return "Usuário";
}

async function executarLimpeza(endpoint, mensagemConfirmacao) {
  const confirmou = window.confirm(mensagemConfirmacao);
  if (!confirmou) {
    return false;
  }

  try {
    const resposta = await apiFetch(endpoint, { method: "DELETE" });

    if (resposta.status === 401 || resposta.status === 403) {
      definirMensagem("Apenas administradores podem executar esta ação.");
      return false;
    }

    const payload = await resposta.json().catch(() => null);

    if (!resposta.ok) {
      definirMensagem(payload?.message || "Não foi possível concluir a limpeza.");
      return false;
    }

    definirMensagem(payload?.message || "Limpeza concluída com sucesso.", "sucesso");
    await carregarResumoOperacional();
    return true;
  } catch {
    definirMensagem("Falha ao conectar com o servidor para concluir a limpeza.");
    return false;
  }
}

function renderizarUsuariosComAcesso(usuarios) {
  const container = obterElemento("listaUsuariosConfig");
  if (!container) {
    return;
  }

  if (!usuarios || usuarios.length === 0) {
    container.innerHTML = `<p class="config-access-empty">Nenhum usuário adicional com acesso.</p>`;
    return;
  }

  container.innerHTML = usuarios.map(usuario => `
    <div class="config-access-item">
      <div>
        <strong>${usuario.name || "-"}</strong>
        <span>${usuario.email || "-"}</span>
      </div>
      <span class="config-access-role">${formatarPerfilUsuario(usuario.role)}</span>
    </div>
  `).join("");
}

function carregarEmpresaLocal() {
  const dados = localStorage.getItem("empresaCadastrada");

  if (!dados) {
    empresa = {
      empresa: localStorage.getItem("nomeComercio") || "StockControl",
      email: ""
    };
    return;
  }

  try {
    empresa = JSON.parse(dados);
  } catch {
    empresa = {
      empresa: localStorage.getItem("nomeComercio") || "StockControl",
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

async function contarRegistros(endpoint) {
  try {
    const resposta = await apiFetch(endpoint);
    if (!resposta.ok) {
      return null;
    }
    const dados = await resposta.json();
    return Array.isArray(dados) ? dados.length : null;
  } catch {
    return null;
  }
}

async function carregarResumoOperacional() {
  try {
    const usuariosResponse = await apiFetch("/api/users");

    if (usuariosResponse.status === 401 || usuariosResponse.status === 403) {
      logout();
      return;
    }

    let usuarios = [];
    if (usuariosResponse.ok) {
      usuarios = await usuariosResponse.json();
    }

    definirTexto("resumoUsuariosConfig", String(usuarios.length));
    definirTexto("contadorUsuariosAcesso", String(usuarios.length));
    renderizarUsuariosComAcesso(usuarios);
    definirStatusApi("API conectada", true);

    // Indicadores operacionais do catalogo.
    const [produtos, categorias, fornecedores] = await Promise.all([
      contarRegistros("/api/products"),
      contarRegistros("/api/categories"),
      contarRegistros("/api/suppliers")
    ]);

    definirTexto("resumoProdutosConfig", produtos === null ? "-" : String(produtos));
    definirTexto("resumoCategoriasConfig", categorias === null ? "-" : String(categorias));
    definirTexto("resumoFornecedoresConfig", fornecedores === null ? "-" : String(fornecedores));
  } catch {
    definirStatusApi("Conexão instável", false);
    definirMensagem("Nao foi possivel atualizar os indicadores do ambiente.");
    definirTexto("resumoUsuariosConfig", "-");
    renderizarUsuariosComAcesso([]);
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
  executarLimpeza(
    "/api/maintenance/sales",
    "Aviso: esta ação vai apagar todas as vendas registradas e restaurar as quantidades vendidas ao estoque. Deseja continuar?"
  );
}

function limparEstoque() {
  executarLimpeza(
    "/api/maintenance/inventory",
    "Aviso: esta ação vai apagar todos os produtos e movimentações do estoque. Você perderá esses dados. Deseja continuar?"
  );
}

preencherFormularioEmpresa();
preencherResumoSessao();
carregarResumoOperacional();
