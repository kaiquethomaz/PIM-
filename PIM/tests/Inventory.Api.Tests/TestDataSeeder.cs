using Inventory.Api.Data;
using Inventory.Api.Entities;
using Inventory.Api.Enums;
using Inventory.Api.Services;

namespace Inventory.Api.Tests;

public static class TestDataSeeder
{
    public static void Seed(AppDbContext db, IPasswordHasher hasher)
    {
        if (!db.Companies.Any())
        {
            db.Companies.Add(new Company
            {
                Name = "Empresa Teste",
                Cnpj = "12.345.678/0001-99",
                Email = "empresa@test.com",
                PasswordHash = hasher.Hash("Empresa@123")
            });
            db.SaveChanges();
        }

        var companyId = db.Companies
            .OrderBy(x => x.Id)
            .Select(x => x.Id)
            .First();

        if (!db.Users.Any(x => x.Email == "manager@test.com"))
        {
            db.Users.Add(new User
            {
                Name = "Manager",
                Email = "manager@test.com",
                PasswordHash = hasher.Hash("Manager@123"),
                Role = UserRole.Manager,
                CompanyId = companyId
            });
        }

        if (!db.Users.Any(x => x.Email == "employee@test.com"))
        {
            db.Users.Add(new User
            {
                Name = "Employee",
                Email = "employee@test.com",
                PasswordHash = hasher.Hash("Employee@123"),
                Role = UserRole.Employee,
                CompanyId = companyId
            });
        }

        if (!db.Categories.Any(x => x.Name == "Eletronicos"))
        {
            db.Categories.Add(new Category { Name = "Eletronicos", CompanyId = companyId });
        }

        if (!db.Suppliers.Any(x => x.Name == "Fornecedor XPTO"))
        {
            db.Suppliers.Add(new Supplier
            {
                Name = "Fornecedor XPTO",
                Contact = "11999999999",
                CompanyId = companyId
            });
        }

        db.SaveChanges();

        if (!db.Products.Any(x => x.Name == "Mouse Gamer"))
        {
            var categoryId = db.Categories.Single(x => x.Name == "Eletronicos").Id;
            var supplierId = db.Suppliers.Single(x => x.Name == "Fornecedor XPTO").Id;

            db.Products.Add(new Product
            {
                Name = "Mouse Gamer",
                CompanyId = companyId,
                CategoryId = categoryId,
                SupplierId = supplierId,
                Price = 199.90m,
                Quantity = 10
            });
        }

        db.SaveChanges();
    }
}
