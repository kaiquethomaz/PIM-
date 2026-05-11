async function cadastrarUsuario() {
  const nome = document.getElementById("nome").value.trim();
  const email = document.getElementById("email").value.trim();
  const senha = document.getElementById("senha").value.trim();
  const confirmarSenha = document.getElementById("confirmarSenha").value.trim();
  const erro = document.getElementById("erro");

  erro.innerText = "";

  if (!nome || !email || !senha || !confirmarSenha) {
    erro.innerText = "Preencha todos os campos.";
    return;
  }

  if (senha !== confirmarSenha) {
    erro.innerText = "As senhas não coincidem.";
    return;
  }

  try {
    const resposta = await apiFetch("/api/users", {
      method: "POST",
      body: JSON.stringify({
        name: nome,
        email,
        password: senha,
        role: 1
      })
    });

    if (resposta.status === 401 || resposta.status === 403) {
      erro.innerText = "Apenas administradores podem cadastrar usuários.";
      return;
    }

    if (!resposta.ok) {
      let mensagem = "Erro ao cadastrar usuário.";
      try {
        const data = await resposta.json();
        if (data && data.message) {
          mensagem = data.message;
        }
      } catch {
        // mantém mensagem padrão
      }
      erro.innerText = mensagem;
      return;
    }

    document.getElementById("nome").value = "";
    document.getElementById("email").value = "";
    document.getElementById("senha").value = "";
    document.getElementById("confirmarSenha").value = "";

    alert("Usuário cadastrado com sucesso!");
  } catch (error) {
    erro.innerText = "Falha ao conectar com o servidor.";
  }
}
