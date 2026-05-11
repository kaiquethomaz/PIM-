using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Inventory.Api.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "categorias",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    nome = table.Column<string>(type: "TEXT", maxLength: 120, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_categorias", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "fornecedores",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    nome = table.Column<string>(type: "TEXT", maxLength: 120, nullable: false),
                    contato = table.Column<string>(type: "TEXT", maxLength: 180, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_fornecedores", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "usuarios",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    nome = table.Column<string>(type: "TEXT", maxLength: 120, nullable: false),
                    email = table.Column<string>(type: "TEXT", maxLength: 120, nullable: false),
                    senha = table.Column<string>(type: "TEXT", nullable: false),
                    tipo = table.Column<string>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_usuarios", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "produtos",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    nome = table.Column<string>(type: "TEXT", maxLength: 120, nullable: false),
                    categoria_id = table.Column<int>(type: "INTEGER", nullable: false),
                    fornecedor_id = table.Column<int>(type: "INTEGER", nullable: false),
                    preco = table.Column<decimal>(type: "TEXT", precision: 18, scale: 2, nullable: false),
                    quantidade = table.Column<int>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_produtos", x => x.Id);
                    table.ForeignKey(
                        name: "FK_produtos_categorias_categoria_id",
                        column: x => x.categoria_id,
                        principalTable: "categorias",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_produtos_fornecedores_fornecedor_id",
                        column: x => x.fornecedor_id,
                        principalTable: "fornecedores",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "movimentacoes",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    produto_id = table.Column<int>(type: "INTEGER", nullable: false),
                    tipo = table.Column<string>(type: "TEXT", nullable: false),
                    quantidade = table.Column<int>(type: "INTEGER", nullable: false),
                    data = table.Column<DateTime>(type: "TEXT", nullable: false),
                    usuario_id = table.Column<int>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_movimentacoes", x => x.Id);
                    table.ForeignKey(
                        name: "FK_movimentacoes_produtos_produto_id",
                        column: x => x.produto_id,
                        principalTable: "produtos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_movimentacoes_usuarios_usuario_id",
                        column: x => x.usuario_id,
                        principalTable: "usuarios",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_categorias_nome",
                table: "categorias",
                column: "nome",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_movimentacoes_produto_id",
                table: "movimentacoes",
                column: "produto_id");

            migrationBuilder.CreateIndex(
                name: "IX_movimentacoes_usuario_id",
                table: "movimentacoes",
                column: "usuario_id");

            migrationBuilder.CreateIndex(
                name: "IX_produtos_categoria_id",
                table: "produtos",
                column: "categoria_id");

            migrationBuilder.CreateIndex(
                name: "IX_produtos_fornecedor_id",
                table: "produtos",
                column: "fornecedor_id");

            migrationBuilder.CreateIndex(
                name: "IX_usuarios_email",
                table: "usuarios",
                column: "email",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "movimentacoes");

            migrationBuilder.DropTable(
                name: "produtos");

            migrationBuilder.DropTable(
                name: "usuarios");

            migrationBuilder.DropTable(
                name: "categorias");

            migrationBuilder.DropTable(
                name: "fornecedores");
        }
    }
}
