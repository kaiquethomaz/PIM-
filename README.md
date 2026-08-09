<div align="center">

# 📦 PIM — Sistema de Controle de Estoque

Sistema web full-stack para controle de estoque com autenticação JWT, perfis de acesso,
movimentação de produtos, relatórios gerenciais e **previsão de demanda com Machine Learning**.

[![.NET](https://img.shields.io/badge/.NET-8.0-512BD4?logo=dotnet&logoColor=white)](https://dotnet.microsoft.com/)
[![C#](https://img.shields.io/badge/C%23-239120?logo=csharp&logoColor=white)](https://learn.microsoft.com/dotnet/csharp/)
[![Entity Framework](https://img.shields.io/badge/EF%20Core-9.0-512BD4)](https://learn.microsoft.com/ef/core/)
[![ML.NET](https://img.shields.io/badge/ML.NET-3.0-9B4F96)](https://dotnet.microsoft.com/apps/machinelearning-ai/ml-dotnet)
[![JWT](https://img.shields.io/badge/Auth-JWT-000000?logo=jsonwebtokens&logoColor=white)](https://jwt.io/)
[![SQLite](https://img.shields.io/badge/SQLite-003B57?logo=sqlite&logoColor=white)](https://www.sqlite.org/)
[![MySQL](https://img.shields.io/badge/MySQL-4479A1?logo=mysql&logoColor=white)](https://www.mysql.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

</div>

---

## ✨ Sobre o projeto

O **PIM** é uma aplicação de gestão de estoque pensada para um cenário **multiempresa**. Permite
cadastrar empresas, usuários, categorias, fornecedores e produtos, registrar entradas e saídas de
mercadorias e acompanhar tudo por meio de relatórios e previsões geradas a partir do histórico
operacional.

O projeto é dividido em três camadas:

- 🔵 **API** em ASP.NET Core (Minimal API) com Entity Framework Core;
- 🟢 **Front-end** estático em HTML, CSS e JavaScript, responsivo;
- 🟣 **Machine Learning** com ML.NET para previsão de demanda, vendas e faturamento.

## 🚀 Começar em 1 comando (modo demo)

Não precisa instalar banco de dados. O projeto vem configurado para rodar com **SQLite** e
**popular dados de exemplo automaticamente** — ideal para testar rápido.

```bash
# 1. Suba a API (cria e popula o banco SQLite sozinho)
cd PIM/src/Inventory.Api
dotnet run

# 2. Em outro terminal, suba o front-end
cd PIM/front
node server.js
```

Acesse **http://localhost:8080** e entre com o usuário de demonstração:

| Campo   | Valor                   |
| ------- | ----------------------- |
| E-mail  | `admin@inventory.local` |
| Senha   | `Admin@123`             |
| Perfil  | Administrador           |

> 💡 A documentação interativa da API (Swagger) fica em **http://localhost:5000/swagger**.

## 🖼️ Telas

> 🚧 Screenshots em preparação — serão adicionados em
> [`PIM/docs/screenshots/`](PIM/docs/screenshots) (guia de captura no
> [README da pasta](PIM/docs/screenshots/README.md)). Enquanto isso, rode o
> [modo demo](#-começar-em-1-comando-modo-demo) para ver o sistema em funcionamento.

## 🧩 Principais funcionalidades

- 🔐 Autenticação com **JWT**;
- 👥 Controle de acesso por perfil (`Admin`, `Manager`, `Employee`);
- 🏢 Cadastro de empresas e usuários;
- 🏷️ Cadastro de categorias e fornecedores;
- 📦 Cadastro, listagem, edição e remoção de produtos;
- 🔁 Registro de movimentações de entrada e saída, com **bloqueio de estoque negativo**;
- 📊 Relatórios de estoque, movimentações e ranking de mais vendidos;
- 🔮 Previsão de **demanda, vendas e faturamento** com ML.NET.

## 🏗️ Arquitetura

```text
.
├── README.md
├── LICENSE
├── PIM--main.sln
├── inicia-backend.bat / inicia-frontend.bat / inicia-tudo.bat
└── PIM/
    ├── docs/
    │   ├── mysql/seed-legacy.sql      # script opcional para MySQL
    │   └── screenshots/               # imagens usadas no README
    ├── front/                         # HTML + CSS + JS (servidor Node simples)
    │   ├── *.html
    │   ├── global.css
    │   ├── js/
    │   └── server.js
    ├── src/Inventory.Api/             # API ASP.NET Core
    │   ├── Auth/  Data/  Dtos/  Entities/  Enums/
    │   ├── Migrations/  Services/
    │   ├── Program.cs
    │   ├── appsettings.json           # config padrão (demo/SQLite)
    │   └── appsettings.Example.json   # exemplo para produção (MySQL)
    └── tests/Inventory.Api.Tests/     # testes de integração (xUnit)
```

## 🛠️ Tecnologias

- **.NET 8** · ASP.NET Core Minimal API
- **Entity Framework Core 9** (SQLite e MySQL)
- **JWT Bearer Authentication** · **BCrypt**
- **ML.NET** (Time Series)
- **HTML, CSS e JavaScript** · **Node.js** (servidor local do front)

## ⚙️ Configuração

O provedor de banco é configurável em `PIM/src/Inventory.Api/appsettings.json`:

```json
{
  "Database": { "Provider": "Sqlite" },
  "ConnectionStrings": { "DefaultConnection": "Data Source=inventory.db" }
}
```

- **`Sqlite`** (padrão) — zero configuração, cria e popula o banco automaticamente.
- **`MySql`** — para um cenário mais próximo de produção. Veja
  [`appsettings.Example.json`](PIM/src/Inventory.Api/appsettings.Example.json) e o script
  [`PIM/docs/mysql/seed-legacy.sql`](PIM/docs/mysql/seed-legacy.sql).

> 🔒 **Segredos:** a chave JWT e as credenciais do `appsettings.json` são apenas para
> desenvolvimento. Em produção, defina-as por variáveis de ambiente
> (`Jwt__Key`, `ConnectionStrings__DefaultConnection`, etc.) ou *user-secrets* —
> nunca versione segredos reais.

## 📚 Endpoints principais

<details>
<summary>Ver lista completa de endpoints</summary>

### Autenticação e empresa
- `POST /api/auth/login`
- `POST /api/companies/register`
- `POST /api/companies/login`

### Usuários
- `POST /api/users` · `GET /api/users` · `PUT /api/users/{id}`

### Categorias
- `POST /api/categories` · `GET /api/categories`

### Fornecedores
- `POST /api/suppliers` · `GET /api/suppliers`

### Produtos
- `POST /api/products` · `GET /api/products` · `PUT /api/products/{id}` · `DELETE /api/products/{id}`

### Movimentações
- `POST /api/movements` · `GET /api/movements`

### Relatórios
- `GET /api/reports/stock`
- `GET /api/reports/movements`
- `GET /api/reports/top-selling`
- `GET /api/reports/demand-forecast`
- `GET /api/reports/sales-forecast`
- `GET /api/reports/revenue-forecast`

</details>

## 🧪 Testes

```bash
dotnet test PIM--main.sln
```

## 📄 Licença

Distribuído sob a licença MIT. Veja [`LICENSE`](LICENSE) para mais detalhes.
