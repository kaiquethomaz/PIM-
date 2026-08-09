using System.Data.Common;
using Inventory.Api.Data;
using Inventory.Api.Services;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;

namespace Inventory.Api.Tests;

public class CustomWebApplicationFactory : WebApplicationFactory<Program>
{
    private DbConnection? _connection;

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");
        builder.ConfigureAppConfiguration((_, config) =>
        {
            config.AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["ConnectionStrings:DefaultConnection"] = "Data Source=:memory:",
                ["Jwt:Issuer"] = "Inventory.Api.Tests",
                ["Jwt:Audience"] = "Inventory.Api.Tests.Client",
                ["Jwt:Key"] = "uma-chave-de-teste-bem-secreta-com-32-caracteres",
                ["SeedAdmin:Name"] = "Admin",
                ["SeedAdmin:Email"] = "admin@test.com",
                ["SeedAdmin:Password"] = "Admin@123"
            });
        });
        builder.ConfigureServices(services =>
        {
            services.RemoveAll<DbContextOptions<AppDbContext>>();
            services.RemoveAll<AppDbContext>();

            _connection = new SqliteConnection("Data Source=:memory:");
            _connection.Open();

            services.AddDbContext<AppDbContext>(options => options.UseSqlite(_connection));
        });
    }

    /// <summary>
    /// Recria o esquema e repovoa os dados de teste. Chamado antes de cada teste
    /// para garantir isolamento total, mesmo com o banco in-memory compartilhado.
    /// </summary>
    public void ResetState()
    {
        using var scope = Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var hasher = scope.ServiceProvider.GetRequiredService<IPasswordHasher>();

        db.Database.EnsureDeleted();
        db.Database.EnsureCreated();

        TestDataSeeder.Seed(db, hasher);
    }

    protected override void Dispose(bool disposing)
    {
        base.Dispose(disposing);
        _connection?.Dispose();
    }
}
