# PIM

Diretório principal do sistema de controle de estoque, reunindo front-end, API, testes automatizados e materiais de apoio.

## Estrutura

```text
PIM/
|-- docs/
|   `-- mysql/
|       `-- seed-legacy.sql
|-- front/
|   |-- *.html
|   |-- global.css
|   |-- js/
|   `-- server.js
|-- src/
|   `-- Inventory.Api/
|       |-- Data/
|       |-- Dtos/
|       |-- Entities/
|       |-- Migrations/
|       |-- Services/
|       |-- Program.cs
|       `-- appsettings.json
`-- tests/
    `-- Inventory.Api.Tests/
```

## O que o projeto entrega

- autenticação com JWT;
- controle de acesso por perfis;
- cadastro de empresas, usuários, categorias e fornecedores;
- cadastro e gerenciamento de produtos;
- movimentações de entrada e saída de estoque;
- relatórios operacionais;
- previsões de demanda, vendas e faturamento.

## Como executar

### API

```powershell
cd PIM\src\Inventory.Api
dotnet restore
dotnet run
```

### Front-end

```powershell
cd PIM\front
node server.js
```

### Testes

```powershell
dotnet test PIM--main.sln
```

## Pré-requisitos

- .NET SDK 8
- Node.js 18 ou superior
- MySQL 8 ou superior

## Documentação complementar

- README principal na raiz do repositório: visão geral completa e setup
- `docs/mysql/seed-legacy.sql`: criação e carga inicial do banco
