/*Pronto*/
const empresa = JSON.parse(
  localStorage.getItem("empresaCadastrada")
);

if (empresa) {
  document.getElementById("empresa").value = empresa.empresa;
  document.getElementById("emailEmpresa").value = empresa.email;
}

function salvarEmpresa() {

  empresa.empresa =
    document.getElementById("empresa").value;

  empresa.email =
    document.getElementById("emailEmpresa").value;

  localStorage.setItem(
    "empresaCadastrada",
    JSON.stringify(empresa)
  );

  localStorage.setItem(
    "nomeComercio",
    empresa.empresa
  );

  alert("Alterações salvas!");
}

function limparVendas() {

  localStorage.removeItem("vendas");

  alert("Vendas removidas.");
}

function limparEstoque() {

  localStorage.removeItem("produtos");

  alert("Estoque removido.");
}

function alterarTema(tipo) {

  if (tipo === "escuro") {
    document.body.style.background = "#111";
  } else {
    document.body.style.background = "#e7e7e7";
  }
}