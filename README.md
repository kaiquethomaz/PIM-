# PIM

Sistema web de controle de estoque com autenticação, perfis de acesso, movimentação de produtos, relatórios gerenciais e previsões baseadas no histórico operacional.

O projeto é composto por:

- uma API em ASP.NET Core com Entity Framework Core;
- um front-end estático em HTML, CSS e JavaScript;
- scripts auxiliares para execução local;
- material de apoio e script de banco em MySQL.

## Visão geral

O sistema foi desenvolvido para apoiar operações de estoque em um cenário multiempresa. A aplicação permite cadastro de empresas, usuários, categorias, fornecedores e produtos, além do registro de entradas e saídas de mercadorias. A API também disponibiliza relatórios de estoque, histórico de movimentações, produtos mais vendidos e previsões de demanda, vendas e faturamento.

## Principais funcionalidades

- autenticação com JWT;
- controle de acesso por perfil (`Admin`, `Manager` e `Employee`);
- cadastro e manutenção de usuários;
- cadastro de categorias e fornecedores;
- cadastro, listagem, edição e remoção de produtos;
- registro de movimentações de entrada e saída;
- bloqueio de estoque negativo;
- relatórios de estoque e movimentações;
- ranking de produtos mais vendidos;
- previsão de demanda, vendas e faturamento com ML.NET.

## Arquitetura do projeto

```text
.
|-- README.md
|-- inicia-backend.bat
|-- inicia-frontend.bat
|-- inicia-tudo.bat
|-- PIM--main.sln
`-- PIM/
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

## Tecnologias utilizadas

- .NET 8
- ASP.NET Core Minimal API
- Entity Framework Core
- MySQL
- JWT Bearer Authentication
- BCrypt
- ML.NET
- HTML, CSS e JavaScript
- Node.js para servidor local do front-end

## Pré-requisitos

Para executar o projeto localmente, é recomendado ter instalado:

- .NET SDK 8.0 ou superior
- Node.js 18 ou superior
- MySQL Server 8.0 ou superior
- Git

## Configuração do ambiente

### 1. Banco de dados

A API está configurada para utilizar MySQL. A string de conexão padrão está em `PIM/src/Inventory.Api/appsettings.json`, com os seguintes parâmetros:

```json
"ConnectionStrings": {
  "DefaultConnection": "server=127.0.0.1;port=3306;database=inventory;user=root;password=root123"
}
```

Antes de iniciar a aplicação, crie ou configure uma instância local do MySQL compatível com essa conexão. Se necessário, ajuste usuário, senha, porta ou nome do banco no arquivo `appsettings.json`.

O projeto também possui um script SQL de apoio em:

- `PIM/docs/mysql/seed-legacy.sql`

Esse arquivo pode ser utilizado para criar a base `inventory` e popular dados iniciais de teste.

### 2. Configuração do JWT

No mesmo arquivo `appsettings.json`, estão definidos os parâmetros de autenticação:

```json
"Jwt": {
  "Issuer": "Inventory.Api",
  "Audience": "Inventory.Api",
  "Key": "1234567890123456789012345678901234567890",
  "ExpirationMinutes": 180
}
```

Em ambiente acadêmico ou local, essa configuração atende ao desenvolvimento. Para uso em produção, o ideal é mover segredos e credenciais para variáveis de ambiente ou cofre de segredos.

## Como executar o projeto

### Opção 1. Execução rápida com scripts

Na raiz do projeto, estão disponíveis os seguintes scripts:

- `inicia-backend.bat`: inicia apenas a API;
- `inicia-frontend.bat`: inicia apenas o front-end;
- `inicia-tudo.bat`: inicia API e front-end em janelas separadas.

### Opção 2. Execução manual

#### Subir a API

```powershell
cd PIM\src\Inventory.Api
dotnet restore
dotnet run
```

Após iniciar, a API ficará disponível em:

- `http://localhost:5000`
- Swagger: `http://localhost:5000/swagger`

#### Subir o front-end

```powershell
cd PIM\front
node server.js
```

Após iniciar, o front-end ficará disponível em:

- `http://localhost:8080`

## Fluxo básico de uso

1. Inicie o banco MySQL local.
2. Execute a API.
3. Execute o front-end.
4. Acesse `http://localhost:8080`.
5. Utilize as rotas da API ou a interface web para autenticação, cadastros e movimentações.

## Endpoints principais da API

### Autenticação e empresa

- `POST /api/auth/login`
- `POST /api/companies/register`
- `POST /api/companies/login`

### Usuários

- `POST /api/users`
- `GET /api/users`
- `PUT /api/users/{id}`

### Categorias

- `POST /api/categories`
- `GET /api/categories`

### Fornecedores

- `POST /api/suppliers`
- `GET /api/suppliers`

### Produtos

- `POST /api/products`
- `GET /api/products`
- `PUT /api/products/{id}`
- `DELETE /api/products/{id}`

### Movimentações

- `POST /api/movements`
- `GET /api/movements`

### Relatórios

- `GET /api/reports/stock`
- `GET /api/reports/movements`
- `GET /api/reports/top-selling`
- `GET /api/reports/demand-forecast`
- `GET /api/reports/sales-forecast`
- `GET /api/reports/revenue-forecast`

## Testes

Para executar os testes automatizados:

```powershell
dotnet test PIM--main.sln
```

## Observações importantes

- o front-end é estático e utiliza um servidor Node.js simples para desenvolvimento local;
- a API utiliza autenticação JWT e regras de autorização por perfil;
- o sistema registra vendas como movimentações de saída no estoque;
- o script `seed-legacy.sql` é útil para carga inicial e demonstração do sistema;
- a documentação interativa da API está disponível via Swagger após subir o backend.

## Melhorias recomendadas para produção

- mover credenciais e chave JWT para variáveis de ambiente;
- usar CORS restritivo em vez de `AllowAnyOrigin`;
- configurar logs e monitoramento;
- criar pipeline de build e deploy;
- separar configurações por ambiente.
