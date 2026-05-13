# PIM

Projeto de controle de estoque com front-end estático e API em ASP.NET Core.

## Estrutura

```text
PIM/
  front/                      Front-end HTML, CSS e JavaScript
  src/Inventory.Api/          API, banco SQLite, migrations e regras de negócio
  tests/Inventory.Api.Tests/  Testes automatizados da API
  docs/                       Materiais de apoio e arquivos auxiliares
```

## Scripts úteis

- `inicia-backend.bat`: sobe a API
- `inicia-frontend.bat`: sobe o servidor do front
- `inicia-tudo.bat`: sobe front e back em janelas separadas

## Execução manual

Back-end:

```powershell
cd PIM\src\Inventory.Api
dotnet run
```

Front-end:

```powershell
cd PIM\front
node server.js
```

## Observações

- Arquivos gerados como `bin/`, `obj/` e bancos SQLite locais não entram no git.
- Materiais de referência que não fazem parte do código-fonte ficam em `PIM/docs/`.
