async function loginUsuario() {

  const usuario = document.getElementById("usuario").value.trim();
  const senha = document.getElementById("senhaUsuario").value.trim();
  const perfil = document.getElementById("perfil").value;

  const erro = document.getElementById("erro");

  erro.innerText = "";

  if (!usuario || !senha || !perfil) {
    erro.innerText = "Preencha todos os campos.";
    return;
  }

  try {
    const resposta = await apiFetch("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({
        email: usuario,
        password: senha
      })
    });

    if (resposta.status === 401) {
      erro.innerText = "Usuário ou senha inválidos.";
      return;
    }

    if (!resposta.ok) {
      erro.innerText = "Não foi possível autenticar.";
      return;
    }

    const dados = await resposta.json();
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

    window.location.href = "dashboard.html";
  } catch (error) {
    erro.innerText = "Falha ao conectar com o servidor.";
  }
}
/*pronto*/
