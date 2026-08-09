using Inventory.Api.Dtos;
using Inventory.Api.Entities;
using Inventory.Api.Enums;
using Inventory.Api.Services;
using Microsoft.EntityFrameworkCore;

namespace Inventory.Api.Data;

public static class SeedData
{
    public static async Task InitializeAsync(IServiceProvider services, IConfiguration configuration)
    {
        await using var scope = services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var hasher = scope.ServiceProvider.GetRequiredService<IPasswordHasher>();

        await db.Database.EnsureCreatedAsync();

        User adminUser;
        var adminName = configuration["SeedAdmin:Name"] ?? "Administrador";
        var adminEmail = configuration["SeedAdmin:Email"] ?? "admin@pim.local";
        var adminPassword = configuration["SeedAdmin:Password"] ?? "Admin@123";

        Company company;
        if (!await db.Companies.AnyAsync())
        {
            company = new Company
            {
                Name = "Empresa Seed",
                Cnpj = "12.345.678/0001-99",
                Email = "empresa@inventory.local",
                PasswordHash = hasher.Hash(adminPassword)
            };

            db.Companies.Add(company);
            await db.SaveChangesAsync();
        }
        else
        {
            company = await db.Companies.OrderBy(x => x.Id).FirstAsync();
        }

        if (!await db.Users.AnyAsync())
        {
            adminUser = new User
            {
                Name = adminName,
                Email = adminEmail,
                PasswordHash = hasher.Hash(adminPassword),
                Role = UserRole.Admin,
                CompanyId = company.Id
            };

            db.Users.Add(adminUser);
            await db.SaveChangesAsync();
        }
        else
        {
            adminUser = await db.Users
                .OrderBy(x => x.Id)
                .FirstAsync();
        }

        if (!await db.Categories.AnyAsync())
        {
            db.Categories.AddRange(
                new Category { Name = "Alimentos", CompanyId = company.Id },
                new Category { Name = "Limpeza", CompanyId = company.Id }
            );
        }

        if (!await db.Suppliers.AnyAsync())
        {
            db.Suppliers.AddRange(
                new Supplier { Name = "Fornecedor Alfa", Contact = "contato@alfasup.com", CompanyId = company.Id },
                new Supplier { Name = "Fornecedor Beta", Contact = "contato@betasup.com", CompanyId = company.Id }
            );
        }

        await db.SaveChangesAsync();

        if (!await db.Products.AnyAsync())
        {
            var categorias = await db.Categories.OrderBy(x => x.Id).ToListAsync();
            var fornecedores = await db.Suppliers.OrderBy(x => x.Id).ToListAsync();

            var categoriaAlimentos = categorias.First();
            var categoriaLimpeza = categorias.Last();
            var fornecedorAlfa = fornecedores.First();
            var fornecedorBeta = fornecedores.Last();

            // Catalogo de demonstracao: (nome, categoria, fornecedor, preco, peso de venda, estoque final)
            var catalogo = new[]
            {
                (Nome: "Arroz",       Categoria: categoriaAlimentos, Fornecedor: fornecedorBeta, Preco: 28.00m, Peso: 3.0, EstoqueFinal: 24),
                (Nome: "Café",        Categoria: categoriaAlimentos, Fornecedor: fornecedorAlfa, Preco: 18.00m, Peso: 2.2, EstoqueFinal: 18),
                (Nome: "Feijão",      Categoria: categoriaAlimentos, Fornecedor: fornecedorBeta, Preco: 9.50m,  Peso: 2.6, EstoqueFinal: 30),
                (Nome: "Açúcar",      Categoria: categoriaAlimentos, Fornecedor: fornecedorAlfa, Preco: 4.20m,  Peso: 1.8, EstoqueFinal: 12),
                (Nome: "Detergente",  Categoria: categoriaLimpeza,   Fornecedor: fornecedorAlfa, Preco: 3.50m,  Peso: 1.2, EstoqueFinal: 3),
                (Nome: "Sabão em pó", Categoria: categoriaLimpeza,   Fornecedor: fornecedorBeta, Preco: 12.90m, Peso: 0.9, EstoqueFinal: 8),
            };

            // Random com semente fixa: os dados de demo ficam iguais a cada execucao.
            var random = new Random(20240501);
            var hoje = DateTime.UtcNow.Date;
            var movimentos = new List<StockMovement>();

            foreach (var item in catalogo)
            {
                var produto = new Product
                {
                    Name = item.Nome,
                    CompanyId = company.Id,
                    CategoryId = item.Categoria.Id,
                    SupplierId = item.Fornecedor.Id,
                    Price = item.Preco,
                    Quantity = 0
                };
                db.Products.Add(produto);
                await db.SaveChangesAsync();

                // Vendas (saidas) diarias dos ultimos 45 dias, com tendencia leve de alta,
                // ruido aleatorio e reforco nos fins de semana -> serie realista para o ML.
                var saidas = new List<(DateTime Data, int Qtd)>();
                for (var d = 45; d >= 0; d--)
                {
                    var data = hoje.AddDays(-d);
                    var fimDeSemana = data.DayOfWeek is DayOfWeek.Saturday or DayOfWeek.Sunday ? 1.5 : 1.0;
                    var tendencia = 0.7 + (0.6 * (45 - d) / 45.0);
                    var ruido = random.NextDouble() - 0.4;
                    var qtd = (int)Math.Round(Math.Max(0, item.Peso * fimDeSemana * tendencia + ruido));
                    if (qtd > 0)
                    {
                        saidas.Add((data, qtd));
                    }
                }

                var totalSaidas = saidas.Sum(x => x.Qtd);

                // Reposicoes (entradas) ao longo do periodo.
                var reposicoes = new[]
                {
                    (Data: hoje.AddDays(-30), Qtd: (int)Math.Round(item.Peso * 10)),
                    (Data: hoje.AddDays(-16), Qtd: (int)Math.Round(item.Peso * 10)),
                    (Data: hoje.AddDays(-6),  Qtd: (int)Math.Round(item.Peso * 10)),
                };
                var totalReposicoes = reposicoes.Sum(x => x.Qtd);

                // Entrada inicial dimensionada para fechar no estoque final desejado.
                var entradaInicial = Math.Max(1, totalSaidas + item.EstoqueFinal - totalReposicoes);

                movimentos.Add(new StockMovement
                {
                    ProductId = produto.Id,
                    UserId = adminUser.Id,
                    Type = MovementType.Entry,
                    Quantity = entradaInicial,
                    DateUtc = hoje.AddDays(-50)
                });

                foreach (var rep in reposicoes)
                {
                    movimentos.Add(new StockMovement
                    {
                        ProductId = produto.Id,
                        UserId = adminUser.Id,
                        Type = MovementType.Entry,
                        Quantity = rep.Qtd,
                        DateUtc = rep.Data
                    });
                }

                // Distribuicao realista de formas de pagamento (PIX predominante).
                var formasPagamento = new[] { "PIX", "PIX", "PIX", "Cartão", "Cartão", "Dinheiro" };

                foreach (var saida in saidas)
                {
                    movimentos.Add(new StockMovement
                    {
                        ProductId = produto.Id,
                        UserId = adminUser.Id,
                        Type = MovementType.Exit,
                        Quantity = saida.Qtd,
                        DateUtc = saida.Data,
                        PaymentMethod = formasPagamento[random.Next(formasPagamento.Length)]
                    });
                }

                // Fecha o estoque no valor desejado (coerente com o historico gerado).
                produto.Quantity = entradaInicial + totalReposicoes - totalSaidas;
            }

            db.StockMovements.AddRange(movimentos);
            await db.SaveChangesAsync();
        }
    }
}
