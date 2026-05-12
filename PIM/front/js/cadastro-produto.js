let produtoAtual = null;
let produtoId = null;

function limparSessao() {
  localStorage.removeItem("perfilUsuario");
  localStorage.removeItem("authToken");
  localStorage.removeItem("authExpiresAtUtc");
  localStorage.removeItem("usuarioNome");
  localStorage.removeItem("usuarioEmail");
}

function obterProdutoId() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");
  return id ? Number(id) : null;
}

async function carregarProdutos() {
  const resposta = await apiFetch("/api/products");

  if (resposta.status === 401 || resposta.status === 403) {
    limparSessao();
    window.location.href = "login.html";
    return [];
  }

  if (!resposta.ok) {
    throw new Error("Falha ao carregar produtos.");
  }

  return await resposta.json();
}

async function carregarCategorias() {
  const resposta = await apiFetch("/api/categories");

  if (resposta.status === 401 || resposta.status === 403) {
    limparSessao();
    window.location.href = "login.html";
    return [];
  }

  if (!resposta.ok) {
    throw new Error("Falha ao carregar categorias.");
  }

  return await resposta.json();
}

async function carregarFornecedores() {
  const resposta = await apiFetch("/api/suppliers");

  if (resposta.status === 401 || resposta.status === 403) {
    limparSessao();
    window.location.href = "login.html";
    return [];
  }

  if (!resposta.ok) {
    throw new Error("Falha ao carregar fornecedores.");
  }

  return await resposta.json();
}

async function obterCategoriaId(nome) {
  const categorias = await carregarCategorias();
  const existente = categorias.find(cat => cat.name.toLowerCase() === nome.toLowerCase());

  if (existente) {
    return existente.id;
  }

  const resposta = await apiFetch("/api/categories", {
    method: "POST",
    body: JSON.stringify({ name: nome })
  });

  if (resposta.status === 401 || resposta.status === 403) {
    limparSessao();
    window.location.href = "login.html";
    return null;
  }

  if (!resposta.ok) {
    return null;
  }

  const criada = await resposta.json();
  return criada.id;
}

async function obterFornecedorPadraoId() {
  const fornecedores = await carregarFornecedores();

  if (fornecedores.length > 0) {
    return fornecedores[0].id;
  }

  const resposta = await apiFetch("/api/suppliers", {
    method: "POST",
    body: JSON.stringify({ name: "Fornecedor Padrão", contact: "N/A" })
  });

  if (resposta.status === 401 || resposta.status === 403) {
    limparSessao();
    window.location.href = "login.html";
    return null;
  }

  if (!resposta.ok) {
    return null;
  }

  const criado = await resposta.json();
  return criado.id;
}

async function registrarMovimento(produtoIdMov, tipo, quantidade) {
  const resposta = await apiFetch("/api/movements", {
    method: "POST",
    body: JSON.stringify({
      productId: produtoIdMov,
      type: tipo,
      quantity: quantidade
    })
  });

  if (resposta.status === 401 || resposta.status === 403) {
    limparSessao();
    window.location.href = "login.html";
    return false;
  }

  return resposta.ok;
}

async function salvarProduto() {
  const nome = document.getElementById("nome").value.trim();
  const categoria = document.getElementById("categoria").value.trim();
  const valor = document.getElementById("valor").value.trim();
  const quantidade = document.getElementById("quantidade").value.trim();
  const erro = document.getElementById("erro");

  erro.innerText = "";

  if (!nome || !categoria || !valor || !quantidade) {
    erro.innerText = "Preencha todos os campos.";
    return;
  }

  const quantidadeNumero = Number(quantidade);
  const valorNumero = Number(valor);

  if (quantidadeNumero < 0 || Number.isNaN(quantidadeNumero)) {
    erro.innerText = "Quantidade inválida.";
    return;
  }

  if (valorNumero < 0 || Number.isNaN(valorNumero)) {
    erro.innerText = "Valor inválido.";
    return;
  }

  const categoriaId = await obterCategoriaId(categoria);
  const fornecedorId = await obterFornecedorPadraoId();

  if (!categoriaId || !fornecedorId) {
    erro.innerText = "Não foi possível salvar a categoria ou fornecedor.";
    return;
  }

  if (produtoId) {
    const resposta = await apiFetch(`/api/products/${produtoId}`, {
      method: "PUT",
      body: JSON.stringify({
        name: nome,
        categoryId: categoriaId,
        supplierId: fornecedorId,
        price: valorNumero
      })
    });

    if (resposta.status === 401 || resposta.status === 403) {
      limparSessao();
      window.location.href = "login.html";
      return;
    }

    if (!resposta.ok) {
      const erroApi = await resposta.json().catch(() => null);
      erro.innerText = erroApi?.message || "Não foi possível atualizar o produto.";
      return;
    }

    if (produtoAtual) {
      const diferenca = quantidadeNumero - Number(produtoAtual.quantity);

      if (diferenca !== 0) {
        const tipo = diferenca > 0 ? 1 : 2;
        const quantidadeMov = Math.abs(diferenca);
        const ok = await registrarMovimento(produtoId, tipo, quantidadeMov);

        if (!ok) {
          erro.innerText = "Não foi possível ajustar o estoque.";
          return;
        }
      }
    }

    window.location.href = "estoque.html";
    return;
  }

  const resposta = await apiFetch("/api/products", {
    method: "POST",
    body: JSON.stringify({
      name: nome,
      categoryId: categoriaId,
      supplierId: fornecedorId,
      price: valorNumero,
      quantity: quantidadeNumero
    })
  });

  if (resposta.status === 401 || resposta.status === 403) {
    limparSessao();
    window.location.href = "login.html";
    return;
  }

  if (!resposta.ok) {
    const erroApi = await resposta.json().catch(() => null);
    erro.innerText = erroApi?.message || "Não foi possível cadastrar o produto.";
    return;
  }

  window.location.href = "estoque.html";
}

async function carregarProdutoEdicao() {
  produtoId = obterProdutoId();

  if (!produtoId) {
    return;
  }

  try {
    const produtosApi = await carregarProdutos();
    produtoAtual = produtosApi.find(prod => prod.id === produtoId);

    if (!produtoAtual) {
      return;
    }

    document.getElementById("nome").value = produtoAtual.name;
    document.getElementById("categoria").value = produtoAtual.category;
    document.getElementById("valor").value = produtoAtual.price;
    document.getElementById("quantidade").value = produtoAtual.quantity;
  } catch (error) {
    const erro = document.getElementById("erro");
    if (erro) {
      erro.innerText = "Não foi possível carregar o produto.";
    }
  }
}

carregarProdutoEdicao();
