const vendas = JSON.parse(localStorage.getItem("vendas")) || [];

function carregarRelatorios() {
  const totalVendido = vendas.reduce((total, venda) => {
    return total + Number(venda.total);
  }, 0);

  const qtdVendida = vendas.reduce((total, venda) => {
    return total + Number(venda.quantidade);
  }, 0);

  const pagamentos = {};

  vendas.forEach(venda => {
    pagamentos[venda.pagamento] = (pagamentos[venda.pagamento] || 0) + 1;
  });

  let pagamentoMaisUsado = "-";
  let maior = 0;

  for (let forma in pagamentos) {
    if (pagamentos[forma] > maior) {
      maior = pagamentos[forma];
      pagamentoMaisUsado = forma;
    }
  }

  document.getElementById("totalVendido").innerText =
    "R$ " + totalVendido.toFixed(2);

  document.getElementById("qtdVendida").innerText = qtdVendida;

  document.getElementById("pagamentoMaisUsado").innerText = pagamentoMaisUsado;

  const tabela = document.getElementById("tabelaRelatorios");
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

carregarRelatorios();
/*pronto*/