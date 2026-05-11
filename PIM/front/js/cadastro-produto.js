const produtos = JSON.parse(localStorage.getItem("produtos")) || [];

const indexEditando = localStorage.getItem("produtoEditando");

if (indexEditando !== null) {
  const produto = produtos[indexEditando];

  document.getElementById("nome").value = produto.nome;
  document.getElementById("categoria").value = produto.categoria;
  document.getElementById("codigo").value = produto.codigo;
  document.getElementById("valor").value = produto.valor;
  document.getElementById("quantidade").value = produto.quantidade;
}

/*Pronto*/
function salvarProduto() {
  const nome = document.getElementById("nome").value.trim();
  const categoria = document.getElementById("categoria").value.trim();
  const codigo = document.getElementById("codigo").value.trim();
  const valor = document.getElementById("valor").value.trim();
  const quantidade = document.getElementById("quantidade").value.trim();
  const erro = document.getElementById("erro");

  erro.innerText = "";

  if (!nome || !categoria || !codigo || !valor || !quantidade) {
    erro.innerText = "Preencha todos os campos.";
    return;
  }

  const novoProduto = {
    nome,
    categoria,
    codigo,
    valor,
    quantidade: Number(quantidade)
  };

  if (indexEditando !== null) {
    produtos[indexEditando] = novoProduto;
    localStorage.removeItem("produtoEditando");
  } else {
    produtos.push(novoProduto);

    const movimentacoes = JSON.parse(localStorage.getItem("movimentacoes")) || [];

    movimentacoes.push({
      tipo: "entrada",
      produto: nome,
      quantidade: Number(quantidade),
      data: new Date().toLocaleDateString("pt-BR")
    });

    localStorage.setItem("movimentacoes", JSON.stringify(movimentacoes));
  }

  localStorage.setItem("produtos", JSON.stringify(produtos));

  window.location.href = "estoque.html";
}