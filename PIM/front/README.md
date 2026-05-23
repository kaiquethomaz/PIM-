# Front-end PIM

Interface web do sistema de controle de estoque, desenvolvida com HTML, CSS e JavaScript puros e servida localmente por um servidor HTTP simples em Node.js.

## Responsabilidade do front-end

O front-end consome a API do projeto para realizar autenticação, navegação entre páginas, visualização de estoque, cadastro de registros e acesso aos relatórios disponíveis.

## Estrutura

```text
front/
|-- *.html
|-- global.css
|-- js/
`-- server.js
```

## Pré-requisitos

- Node.js 18 ou superior
- API do projeto em execução

## Como executar

```powershell
cd PIM\front
node server.js
```

O servidor local será iniciado em:

- `http://localhost:8080`

## Observações

- `server.js` é um servidor HTTP simples voltado ao desenvolvimento local;
- para funcionamento completo, a API precisa estar ativa em paralelo;
- a documentação geral do sistema está no `README.md` da raiz do repositório.
