/*pronto*/
let produtos = JSON.parse(localStorage.getItem("produtos")) || [];
let vendas = JSON.parse(localStorage.getItem("vendas")) || [];

const selectProduto = document.getElementById("produto");

function carregarProdutos() {
  selectProduto.innerHTML = `<option value="">Selecione o produto</option>`;

  produtos.forEach((produto, index) => {
    selectProduto.innerHTML += `
      <option value="${index}">
        ${produto.nome} - Estoque: ${produto.quantidade}
      </option>
    `;
  });
}

function renderizarVendas() {
  const tabela = document.getElementById("tabelaVendas");
  tabela.innerHTML = "";

  vendas.forEach((venda, index) => {
    tabela.innerHTML += `
      <tr>
        <td>#${index + 1}</td>
        <td>${venda.produto}</td>
        <td>${venda.data}</td>
        <td>R$ ${venda.total}</td>
        <td>${venda.pagamento}</td>
        <td>${venda.quantidade}</td>
      </tr>
    `;
  });
}

function registrarVenda() {
  const indexProduto = document.getElementById("produto").value;
  const quantidade = Number(document.getElementById("quantidade").value);
  const pagamento = document.getElementById("pagamento").value;
  const erro = document.getElementById("erro");

  erro.innerText = "";

  if (indexProduto === "" || !quantidade || !pagamento) {
    erro.innerText = "Preencha todos os campos.";
    return;
  }

  const produto = produtos[indexProduto];

  if (quantidade <= 0) {
    erro.innerText = "Quantidade inválida.";
    return;
  }

  if (produto.quantidade < quantidade) {
    erro.innerText = "Estoque insuficiente.";
    return;
  }

  produto.quantidade -= quantidade;

  let movimentacoes = JSON.parse(localStorage.getItem("movimentacoes")) || [];

movimentacoes.push({
  tipo: "saida",
  produto: produto.nome,
  quantidade: quantidade,
  data: new Date().toLocaleDateString("pt-BR")
});

localStorage.setItem("movimentacoes", JSON.stringify(movimentacoes));

  const total = (Number(produto.valor) * quantidade).toFixed(2);

  vendas.push({
    produto: produto.nome,
    quantidade,
    total,
    pagamento,
    data: new Date().toLocaleDateString("pt-BR")
  });

  localStorage.setItem("produtos", JSON.stringify(produtos));
  localStorage.setItem("vendas", JSON.stringify(vendas));

  document.getElementById("quantidade").value = "";
  document.getElementById("pagamento").value = "";

  carregarProdutos();
  renderizarVendas();
}

carregarProdutos();
renderizarVendas();