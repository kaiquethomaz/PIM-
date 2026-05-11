# PIM - Back-end de Controle de Estoque

API REST em C# com ASP.NET Core, SQLite, JWT, bcrypt e controle de acesso por perfil.

## Tecnologias

- ASP.NET Core Minimal API
- Entity Framework Core
- SQLite
- JWT Bearer Authentication
- BCrypt para hash de senha
- xUnit para testes

## Perfis de acesso

- `Admin`: acesso total
- `Manager`: relatórios e visualização
- `Employee`: movimentação e consulta

## Funcionalidades entregues

- Login com JWT
- Middleware de autenticação via `UseAuthentication()` e `UseAuthorization()`
- CRUD de produtos
- Cadastro, login, listagem e atualização de usuários
- Cadastro e listagem de categorias
- Cadastro e listagem de fornecedores
- Registro de entrada e saída de estoque
- Bloqueio de estoque negativo
- Histórico completo de movimentações
- Alerta de estoque baixo com regra `< 5`
- Relatórios de estoque atual, movimentações por período e produtos mais vendidos
- Testes de login, CRUD, permissões e regras de estoque

## Estrutura

```text
src/
  Inventory.Api/
tests/
  Inventory.Api.Tests/
```

## Configuração

Edite [appsettings.json](/e:/PIM/src/Inventory.Api/appsettings.json) para ajustar:

- `ConnectionStrings:DefaultConnection`
- `Jwt:Issuer`
- `Jwt:Audience`
- `Jwt:Key`
- `SeedAdmin`

O projeto cria automaticamente um admin inicial se o banco estiver vazio:

- E-mail: `admin@pim.local`
- Senha: `Admin@123`

## Como rodar

1. Instale o SDK do .NET 8.
2. Entre em `src/Inventory.Api`.
3. Rode `dotnet restore`
4. Rode `dotnet run`

Swagger:

- `http://localhost:5000/swagger`
- `https://localhost:5001/swagger`

## Como testar

1. Instale o SDK do .NET 8.
2. Na raiz do projeto, rode `dotnet test`

## Rotas principais

### Autenticação

- `POST /api/auth/login`

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
- `GET /api/reports/movements?startUtc=2026-04-01T00:00:00Z&endUtc=2026-04-15T23:59:59Z`
- `GET /api/reports/top-selling`

## Exemplo de login

```json
{
  "email": "admin@pim.local",
  "password": "Admin@123"
}
```

## Organização no Trello

### Backlog

- Criar banco de dados
- Definir rotas da API
- Criar documentação Swagger

### A Fazer

- Integrar front-end com a API
- Criar dashboard com gráficos

### Em Desenvolvimento

- Ajustes de deploy

### Em Teste

- Fluxo de movimentação de estoque

### Concluído

- Estrutura inicial da API
- Autenticação com JWT
- CRUDs obrigatórios
- Regras de estoque
- Relatórios principais
- Testes automatizados

## Diferenciais sugeridos

- Exportação de relatório em PDF
- Notificação de estoque baixo por e-mail
- Dashboard com gráfico de vendas
- Integração com front-end em modo escuro
