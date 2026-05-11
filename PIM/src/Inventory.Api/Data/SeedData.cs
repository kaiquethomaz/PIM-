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
        var stockService = scope.ServiceProvider.GetRequiredService<IStockService>();

        await db.Database.EnsureCreatedAsync();

        User adminUser;
        var adminName = configuration["SeedAdmin:Name"] ?? "Administrador";
        var adminEmail = configuration["SeedAdmin:Email"] ?? "admin@pim.local";
        var adminPassword = configuration["SeedAdmin:Password"] ?? "Admin@123";

        if (!await db.Users.AnyAsync())
        {
            adminUser = new User
            {
                Name = adminName,
                Email = adminEmail,
                PasswordHash = hasher.Hash(adminPassword),
                Role = UserRole.Admin
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
                new Category { Name = "Alimentos" },
                new Category { Name = "Limpeza" }
            );
        }

        if (!await db.Suppliers.AnyAsync())
        {
            db.Suppliers.AddRange(
                new Supplier { Name = "Fornecedor Alfa", Contact = "contato@alfasup.com" },
                new Supplier { Name = "Fornecedor Beta", Contact = "contato@betasup.com" }
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

            db.Products.AddRange(
                new Product
                {
                    Name = "Café",
                    CategoryId = categoriaAlimentos.Id,
                    SupplierId = fornecedorAlfa.Id,
                    Price = 18.00m,
                    Quantity = 20
                },
                new Product
                {
                    Name = "Arroz",
                    CategoryId = categoriaAlimentos.Id,
                    SupplierId = fornecedorBeta.Id,
                    Price = 28.00m,
                    Quantity = 15
                },
                new Product
                {
                    Name = "Detergente",
                    CategoryId = categoriaLimpeza.Id,
                    SupplierId = fornecedorAlfa.Id,
                    Price = 3.50m,
                    Quantity = 12
                }
            );

            await db.SaveChangesAsync();
        }

        if (!await db.StockMovements.AnyAsync())
        {
            var produtos = await db.Products
                .OrderBy(x => x.Id)
                .ToListAsync();

            if (produtos.Count > 0)
            {
                var agora = DateTime.UtcNow;

                var movimento1 = await stockService.RegisterMovementAsync(
                    new CreateMovementRequest(produtos[0].Id, MovementType.Entry, 10),
                    adminUser.Id,
                    CancellationToken.None);

                movimento1.DateUtc = agora.AddMonths(-2);

                var movimento2 = await stockService.RegisterMovementAsync(
                    new CreateMovementRequest(produtos[0].Id, MovementType.Exit, 4),
                    adminUser.Id,
                    CancellationToken.None);

                movimento2.DateUtc = agora.AddMonths(-1);

                var movimento3 = await stockService.RegisterMovementAsync(
                    new CreateMovementRequest(produtos[1].Id, MovementType.Exit, 6),
                    adminUser.Id,
                    CancellationToken.None);

                movimento3.DateUtc = agora.AddDays(-10);

                var movimento4 = await stockService.RegisterMovementAsync(
                    new CreateMovementRequest(produtos[2].Id, MovementType.Entry, 8),
                    adminUser.Id,
                    CancellationToken.None);

                movimento4.DateUtc = agora.AddDays(-5);

                var movimento5 = await stockService.RegisterMovementAsync(
                    new CreateMovementRequest(produtos[2].Id, MovementType.Exit, 3),
                    adminUser.Id,
                    CancellationToken.None);

                movimento5.DateUtc = agora.AddDays(-2);

                await db.SaveChangesAsync();
            }
        }
    }
}
