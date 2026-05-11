using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Inventory.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddCompanies : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "empresas",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    nome = table.Column<string>(type: "TEXT", maxLength: 150, nullable: false),
                    cnpj = table.Column<string>(type: "TEXT", maxLength: 18, nullable: false),
                    email = table.Column<string>(type: "TEXT", maxLength: 150, nullable: false),
                    senha = table.Column<string>(type: "TEXT", nullable: false),
                    data_criacao = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_empresas", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_empresas_cnpj",
                table: "empresas",
                column: "cnpj",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_empresas_email",
                table: "empresas",
                column: "email",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "empresas");
        }
    }
}
