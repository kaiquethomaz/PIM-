async function cadastrarEmpresa() {
  const empresa = document.getElementById("empresa").value.trim();
  const cnpj = document.getElementById("cnpj").value.trim();
  const email = document.getElementById("email").value.trim();
  const senha = document.getElementById("senha").value.trim();
  const confirmarSenha = document.getElementById("confirmarSenha").value.trim();
  const erro = document.getElementById("erro");

  erro.innerText = "";

  if (!empresa || !cnpj || !email || !senha || !confirmarSenha) {
    erro.innerText = "Preencha todos os campos.";
    return;
  }

  if (senha !== confirmarSenha) {
    erro.innerText = "As senhas não coincidem.";
    return;
  }

  try {
    const resposta = await apiFetch("/api/companies/register", {
      method: "POST",
      body: JSON.stringify({
        name: empresa,
        cnpj,
        email,
        password: senha
      })
    });

    if (!resposta.ok) {
      let mensagem = "Erro ao cadastrar empresa.";
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

    const dadosEmpresa = {
      empresa,
      cnpj,
      email
    };

    localStorage.setItem("empresaCadastrada", JSON.stringify(dadosEmpresa));
    localStorage.setItem("nomeComercio", empresa);

    alert("Empresa cadastrada com sucesso!");
    window.location.href = "login.html";
  } catch (error) {
    erro.innerText = "Falha ao conectar com o servidor.";
  }
}
/*pronto*/
