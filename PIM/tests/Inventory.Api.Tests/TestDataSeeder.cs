using Inventory.Api.Data;
using Inventory.Api.Entities;
using Inventory.Api.Enums;
using Inventory.Api.Services;

namespace Inventory.Api.Tests;

public static class TestDataSeeder
{
    public static void Seed(AppDbContext db, IPasswordHasher hasher)
    {
        if (!db.Users.Any(x => x.Email == "manager@test.com"))
        {
            db.Users.Add(new User
            {
                Name = "Manager",
                Email = "manager@test.com",
                PasswordHash = hasher.Hash("Manager@123"),
                Role = UserRole.Manager
            });
        }

        if (!db.Users.Any(x => x.Email == "employee@test.com"))
        {
            db.Users.Add(new User
            {
                Name = "Employee",
                Email = "employee@test.com",
                PasswordHash = hasher.Hash("Employee@123"),
                Role = UserRole.Employee
            });
        }

        if (!db.Categories.Any(x => x.Name == "Eletronicos"))
        {
            db.Categories.Add(new Category { Name = "Eletronicos" });
        }

        if (!db.Suppliers.Any(x => x.Name == "Fornecedor XPTO"))
        {
            db.Suppliers.Add(new Supplier { Name = "Fornecedor XPTO", Contact = "11999999999" });
        }

        db.SaveChanges();

        if (!db.Products.Any(x => x.Name == "Mouse Gamer"))
        {
            var categoryId = db.Categories.Single(x => x.Name == "Eletronicos").Id;
            var supplierId = db.Suppliers.Single(x => x.Name == "Fornecedor XPTO").Id;

            db.Products.Add(new Product
            {
                Name = "Mouse Gamer",
                CategoryId = categoryId,
                SupplierId = supplierId,
                Price = 199.90m,
                Quantity = 10
            });
        }

        db.SaveChanges();
    }
}
