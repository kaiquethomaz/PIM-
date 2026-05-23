DROP DATABASE IF EXISTS inventory;
CREATE DATABASE inventory;
USE inventory;

-- =========================================
-- EFMIGRATIONS
-- =========================================

CREATE TABLE __EFMigrationsHistory (
    MigrationId VARCHAR(150) NOT NULL,
    ProductVersion VARCHAR(50) NOT NULL,
    PRIMARY KEY (MigrationId)
);

INSERT INTO __EFMigrationsHistory
VALUES ('20260504211357_InitialCreate','8.0.0');

-- =========================================
-- EMPRESAS
-- =========================================

CREATE TABLE empresas (
    Id INT AUTO_INCREMENT PRIMARY KEY,

    nome VARCHAR(255) NOT NULL,
    cnpj VARCHAR(18) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    senha VARCHAR(255) NOT NULL,

    telefone VARCHAR(20),
    endereco VARCHAR(255),

    data_criacao DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO empresas
(Id, nome, cnpj, email, senha, telefone, endereco)
VALUES
(
    1,
    'Inventory Market LTDA',
    '12.345.678/0001-99',
    'empresa@inventory.local',

    -- senha = 123456
    '$2a$11$8cnJ5eBCTbgKXZ.6WwXt/ui2Hfr6xcLxsteBW2hzZb9rAbsjc6kW6',

    '(11) 99999-9999',
    'Rua das Empresas, 100 - Sao Paulo/SP'
);

-- =========================================
-- CATEGORIAS
-- =========================================

CREATE TABLE categorias (
    Id INT AUTO_INCREMENT PRIMARY KEY,

    empresa_id INT NOT NULL,

    nome VARCHAR(255) NOT NULL,

    CONSTRAINT fk_categoria_empresa
        FOREIGN KEY (empresa_id)
        REFERENCES empresas(Id)
);

INSERT INTO categorias (Id, empresa_id, nome) VALUES
(1,1,'Alimentos'),
(2,1,'Bebidas'),
(3,1,'Limpeza'),
(4,1,'Higiene'),
(5,1,'Frios e Laticinios'),
(6,1,'Padaria');

-- =========================================
-- FORNECEDORES
-- =========================================

CREATE TABLE fornecedores (
    Id INT AUTO_INCREMENT PRIMARY KEY,

    empresa_id INT NOT NULL,

    nome VARCHAR(255) NOT NULL,
    contato VARCHAR(50) NOT NULL,

    CONSTRAINT fk_fornecedor_empresa
        FOREIGN KEY (empresa_id)
        REFERENCES empresas(Id)
);

INSERT INTO fornecedores
(Id, empresa_id, nome, contato)
VALUES
(1,1,'Distribuidora Central','11999990001'),
(2,1,'Mega Foods Brasil','11999990002'),
(3,1,'Clean House Produtos','11999990003'),
(4,1,'Laticinios Vale Verde','11999990004'),
(5,1,'Padaria Supply','11999990005');

-- =========================================
-- USUARIOS
-- Roles:
-- 1 = Admin
-- 2 = Manager
-- 3 = Employee
--
-- senha para TODOS:
-- 123456
-- =========================================

CREATE TABLE usuarios (
    Id INT AUTO_INCREMENT PRIMARY KEY,

    empresa_id INT NOT NULL,

    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    senha VARCHAR(255) NOT NULL,

    tipo INT NOT NULL,

    CONSTRAINT fk_usuario_empresa
        FOREIGN KEY (empresa_id)
        REFERENCES empresas(Id)
);

INSERT INTO usuarios
(Id, empresa_id, nome, email, senha, tipo)
VALUES

(1,
1,
'Administrador',
'admin@inventory.local',
'$2a$11$8cnJ5eBCTbgKXZ.6WwXt/ui2Hfr6xcLxsteBW2hzZb9rAbsjc6kW6',
1),

(2,
1,
'Carlos Mendes',
'gerente@inventory.local',
'$2a$11$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
2),

(3,
1,
'Fernanda Lima',
'estoque@inventory.local',
'$2a$11$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
3),

(4,
1,
'Juliana Rocha',
'operador@inventory.local',
'$2a$11$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
3);

-- =========================================
-- PRODUTOS
-- =========================================

CREATE TABLE produtos (
    Id INT AUTO_INCREMENT PRIMARY KEY,

    empresa_id INT NOT NULL,

    nome VARCHAR(255) NOT NULL,

    categoria_id INT NOT NULL,
    fornecedor_id INT NOT NULL,

    preco DECIMAL(10,2) NOT NULL,
    quantidade INT NOT NULL,

    CONSTRAINT fk_produto_empresa
        FOREIGN KEY (empresa_id)
        REFERENCES empresas(Id),

    CONSTRAINT fk_produto_categoria
        FOREIGN KEY (categoria_id)
        REFERENCES categorias(Id),

    CONSTRAINT fk_produto_fornecedor
        FOREIGN KEY (fornecedor_id)
        REFERENCES fornecedores(Id)
);

INSERT INTO produtos
(Id, empresa_id, nome, categoria_id, fornecedor_id, preco, quantidade)
VALUES

(1,1,'Arroz 5Kg',1,1,29.90,47),
(2,1,'Feijao Carioca 1Kg',1,2,8.50,80),
(3,1,'Macarrao Espaguete',1,2,5.99,120),
(4,1,'Refrigerante Cola 2L',2,1,9.99,58),
(5,1,'Agua Mineral 500ml',2,1,2.50,200),
(6,1,'Detergente Liquido',3,3,3.99,89),
(7,1,'Sabao em Po 1Kg',3,3,15.90,40),
(8,1,'Papel Higienico 12 Rolos',4,3,22.90,33),
(9,1,'Shampoo Anticaspa',4,3,18.90,25),
(10,1,'Leite Integral 1L',5,4,5.49,65),
(11,1,'Queijo Mussarela Kg',5,4,42.00,15),
(12,1,'Pao Frances Kg',6,5,18.90,26);

-- =========================================
-- MOVIMENTACOES
-- =========================================

CREATE TABLE movimentacoes (
    Id INT AUTO_INCREMENT PRIMARY KEY,

    produto_id INT NOT NULL,
    usuario_id INT NOT NULL,

    tipo VARCHAR(20) NOT NULL,
    quantidade INT NOT NULL,
    data DATETIME NOT NULL,

    CONSTRAINT fk_movimento_produto
        FOREIGN KEY (produto_id)
        REFERENCES produtos(Id),

    CONSTRAINT fk_movimento_usuario
        FOREIGN KEY (usuario_id)
        REFERENCES usuarios(Id)
);

INSERT INTO movimentacoes
(Id, produto_id, tipo, quantidade, data, usuario_id)
VALUES

(1,1,'Entry',50,'2026-05-18 08:00:00',2),
(2,2,'Entry',80,'2026-05-18 08:10:00',2),
(3,3,'Entry',120,'2026-05-18 08:15:00',2),
(4,4,'Entry',60,'2026-05-18 08:20:00',2),
(5,5,'Entry',200,'2026-05-18 08:25:00',2),
(6,6,'Entry',90,'2026-05-18 08:30:00',3),
(7,7,'Entry',40,'2026-05-18 08:35:00',3),
(8,8,'Entry',35,'2026-05-18 08:40:00',3),

(9,10,'Exit',5,'2026-05-18 10:10:00',4),
(10,1,'Exit',3,'2026-05-18 10:15:00',4),
(11,4,'Exit',2,'2026-05-18 10:20:00',4),
(12,12,'Exit',4,'2026-05-18 10:25:00',4),
(13,6,'Exit',1,'2026-05-18 10:40:00',4),
(14,8,'Exit',2,'2026-05-18 11:00:00',4);

-- =========================================
-- TESTES
-- =========================================

SELECT id, email, senha
FROM usuarios
WHERE email = 'admin@inventory.local';

SELECT *
FROM empresas;

SELECT *
FROM produtos;

SELECT *
FROM movimentacoes;