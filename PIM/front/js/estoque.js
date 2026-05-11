/*Pronto*/
let produtos = JSON.parse(localStorage.getItem("produtos")) || [
  {
    nome: "Café",
    categoria: "Alimentos",
    codigo: "001",
    valor: "18.00",
    quantidade: 20
  },
  {
    nome: "Arroz",
    categoria: "Alimentos",
    codigo: "002",
    valor: "28.00",
    quantidade: 8
  },
  {
    nome: "Detergente",
    categoria: "Limpeza",
    codigo: "003",
    valor: "3.50",
    quantidade: 3
  }
];


const perfil = localStorage.getItem("perfilUsuario");
localStorage.setItem("produtos", JSON.stringify(produtos));

function statusProduto(qtd) {
  if (qtd <= 5) return "baixo";
  if (qtd <= 10) return "medio";
  return "ok";
}

function renderizarEstoque(lista) {
  const tabela = document.getElementById("tabelaEstoque");
  tabela.innerHTML = "";

  lista.forEach((produto, index) => {
    const status = statusProduto(Number(produto.quantidade));

    tabela.innerHTML += `
      <tr>
        <td>${produto.nome}</td>
        <td>${produto.categoria}</td>
        <td>${produto.codigo}</td>
        <td>R$ ${produto.valor}</td>
        <td><span class="status ${status}"></span></td>
       <td class="acoes">
  ${perfil !== "funcionario" ? `
    <span class="material-icons" onclick="editarProduto(${index})">edit</span>
    <span class="material-icons" onclick="excluirProduto(${index})">delete</span>
  ` : `
    <span class="sem-permissao">Sem permissão</span>
  `}
</td>
      </tr>
    `;
  });
}

function carregarCategorias() {
  const select = document.getElementById("filtroCategoria");
  const categorias = [...new Set(produtos.map(p => p.categoria))];

  categorias.forEach(cat => {
    select.innerHTML += `<option value="${cat}">${cat}</option>`;
  });
}

function filtrarEstoque() {
  const busca = document.getElementById("busca").value.toLowerCase();
  const categoria = document.getElementById("filtroCategoria").value;
  const status = document.getElementById("filtroStatus").value;

  const filtrados = produtos.filter(p => {
    const nomeOk = p.nome.toLowerCase().includes(busca);
    const categoriaOk = categoria === "" || p.categoria === categoria;
    const statusOk = status === "" || statusProduto(Number(p.quantidade)) === status;

    return nomeOk && categoriaOk && statusOk;
  });

  renderizarEstoque(filtrados);
}

function editarProduto(index) {
  localStorage.setItem("produtoEditando", index);

  window.location.href = "cadastro-produto.html";
}

function excluirProduto(index) {
  produtos.splice(index, 1);
  localStorage.setItem("produtos", JSON.stringify(produtos));
  renderizarEstoque(produtos);
}



if (perfil === "funcionario") {
  document.getElementById("btnCadastrarProduto").style.display = "none";
}

renderizarEstoque(produtos);
carregarCategorias();