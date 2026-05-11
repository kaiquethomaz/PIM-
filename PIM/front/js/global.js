const nomeComercio = localStorage.getItem("nomeComercio");
const API_BASE = localStorage.getItem("apiBase") || "http://localhost:5000";

if (nomeComercio && document.getElementById("nomeComercio")) {
  document.getElementById("nomeComercio").innerText = nomeComercio;
}

const perfilUsuario = localStorage.getItem("perfilUsuario");

function apiFetch(path, options = {}) {
  const headers = new Headers(options.headers || {});
  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const token = localStorage.getItem("authToken");
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  return fetch(`${API_BASE}${path}`, {
    ...options,
    headers
  });
}

function mapRoleToPerfil(role) {
  if (role === 1 || role === "Admin" || role === "admin") {
    return "admin";
  }
  if (role === 3 || role === "Employee" || role === "employee") {
    return "funcionario";
  }
  return "";
}

function mapPerfilToRoleValue(perfil) {
  if (perfil === "admin") {
    return 1;
  }
  if (perfil === "funcionario") {
    return 3;
  }
  return 0;
}

function aplicarPermissoes() {

  if (!perfilUsuario) {
    window.location.href = "login.html";
    return;
  }

  if (perfilUsuario === "funcionario") {

    document.querySelectorAll(".somente-admin-gerente").forEach(item => {
      item.style.display = "none";
    });

    document.querySelectorAll(".somente-admin").forEach(item => {
      item.style.display = "none";
    });
  }

  if (perfilUsuario === "gerente") {

    document.querySelectorAll(".somente-admin").forEach(item => {
      item.style.display = "none";
    });
  }
}

function bloquearPagina() {

  const paginaAtual = window.location.pathname.split("/").pop();

  if (paginaAtual === "cadastro-usuario.html" && perfilUsuario !== "admin") {
    window.location.href = "dashboard.html";
    return;
  }

  if (perfilUsuario === "funcionario") {

    const paginasBloqueadas = [
      "dashboard.html",
      "relatorios.html",
      "cadastro-produto.html"
    ];

    if (paginasBloqueadas.includes(paginaAtual)) {
      window.location.href = "estoque.html";
    }
  }
}

const paginaAtual = window.location.pathname.split("/").pop();
const paginasPublicas = ["login.html", "index.html"];

if (!paginasPublicas.includes(paginaAtual)) {
  aplicarPermissoes();
  bloquearPagina();
}
/*pronto*/
