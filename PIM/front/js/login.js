async function login() {
  const email = document.getElementById("email").value.trim();
  const senha = document.getElementById("senha").value.trim();
  const perfil = document.getElementById("perfil").value;
  const erro = document.getElementById("erro");

  erro.innerText = "";

  if (!email || !senha || !perfil) {
    erro.innerText = "Preencha todos os campos.";
    return;
  }

  async function autenticar(caminho) {
    const resposta = await apiFetch(caminho, {
      method: "POST",
      body: JSON.stringify({
        email,
        password: senha
      })
    });

    if (resposta.status === 401) {
      return { status: 401 };
    }

    if (!resposta.ok) {
      return { status: resposta.status };
    }

    const dados = await resposta.json();
    return { status: resposta.status, dados };
  }

  try {
    let resultado = await autenticar("/api/auth/login");

    if (resultado.status === 401 && perfil === "admin") {
      resultado = await autenticar("/api/companies/login");
    }

    if (resultado.status === 401) {
      erro.innerText = "Usuário ou senha inválidos.";
      return;
    }

    if (!resultado.dados) {
      erro.innerText = "Não foi possível autenticar.";
      return;
    }

    const dados = resultado.dados;
    const perfilApi = mapRoleToPerfil(dados.user.role);

    if (!perfilApi) {
      erro.innerText = "Perfil do usuário inválido.";
      return;
    }

    if (perfilApi !== perfil) {
      erro.innerText = "Perfil selecionado não corresponde ao usuário.";
      return;
    }

    localStorage.setItem("authToken", dados.token);
    localStorage.setItem("authExpiresAtUtc", dados.expiresAtUtc);
    localStorage.setItem("perfilUsuario", perfilApi);
    localStorage.setItem("usuarioNome", dados.user.name);
    localStorage.setItem("usuarioEmail", dados.user.email);
    if (!localStorage.getItem("nomeComercio")) {
      localStorage.setItem("nomeComercio", dados.user.name);
    }

    window.location.href = "dashboard.html";
  } catch (error) {
    erro.innerText = "Falha ao conectar com o servidor.";
  }
}
/*pronto*/
