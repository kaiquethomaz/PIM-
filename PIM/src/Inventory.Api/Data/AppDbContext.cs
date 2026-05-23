using Inventory.Api.Entities;
using Microsoft.EntityFrameworkCore;

namespace Inventory.Api.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<User> Users => Set<User>();
    public DbSet<Product> Products => Set<Product>();
    public DbSet<Category> Categories => Set<Category>();
    public DbSet<Supplier> Suppliers => Set<Supplier>();
    public DbSet<StockMovement> StockMovements => Set<StockMovement>();
    public DbSet<Company> Companies => Set<Company>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<User>(entity =>
        {
            entity.ToTable("usuarios");

            entity.HasKey(x => x.Id);

            entity.Property(x => x.Name)
                .HasColumnName("nome")
                .HasMaxLength(120)
                .IsRequired();

            entity.Property(x => x.Email)
                .HasColumnName("email")
                .HasMaxLength(120)
                .IsRequired();

            entity.Property(x => x.PasswordHash)
                .HasColumnName("senha")
                .IsRequired();

            entity.Property(x => x.Role)
             .HasColumnName("tipo")
             .IsRequired();

            entity.Property(x => x.CompanyId)
                .HasColumnName("empresa_id")
                .IsRequired();

            entity.HasIndex(x => x.Email).IsUnique();

            entity.HasOne(x => x.Company)
                .WithMany()
                .HasForeignKey(x => x.CompanyId);
        });

        modelBuilder.Entity<Category>(entity =>
        {
            entity.ToTable("categorias");

            entity.HasKey(x => x.Id);

            entity.Property(x => x.Name)
                .HasColumnName("nome")
                .HasMaxLength(120)
                .IsRequired();

            entity.Property(x => x.CompanyId)
                .HasColumnName("empresa_id")
                .IsRequired();

            entity.HasOne(x => x.Company)
                .WithMany()
                .HasForeignKey(x => x.CompanyId);

            entity.HasIndex(x => x.Name).IsUnique();
        });

        modelBuilder.Entity<Supplier>(entity =>
        {
            entity.ToTable("fornecedores");

            entity.HasKey(x => x.Id);

            entity.Property(x => x.Name)
                .HasColumnName("nome")
                .HasMaxLength(120)
                .IsRequired();

            entity.Property(x => x.Contact)
                .HasColumnName("contato")
                .HasMaxLength(180)
                .IsRequired();

            entity.Property(x => x.CompanyId)
                .HasColumnName("empresa_id")
                .IsRequired();

            entity.HasOne(x => x.Company)
                .WithMany()
                .HasForeignKey(x => x.CompanyId);
        });

        modelBuilder.Entity<Product>(entity =>
        {
            entity.ToTable("produtos");

            entity.HasKey(x => x.Id);

            entity.Property(x => x.Name)
                .HasColumnName("nome")
                .HasMaxLength(120)
                .IsRequired();

            entity.Property(x => x.CompanyId)
                .HasColumnName("empresa_id")
                .IsRequired();

            entity.Property(x => x.Price)
                .HasColumnName("preco")
                .HasPrecision(18, 2)
                .IsRequired();

            entity.Property(x => x.Quantity)
                .HasColumnName("quantidade")
                .IsRequired();

            entity.Property(x => x.CategoryId)
                .HasColumnName("categoria_id")
                .IsRequired();

            entity.Property(x => x.SupplierId)
                .HasColumnName("fornecedor_id")
                .IsRequired();

            entity.HasOne(x => x.Category)
                .WithMany(x => x.Products)
                .HasForeignKey(x => x.CategoryId);

            entity.HasOne(x => x.Supplier)
                .WithMany(x => x.Products)
                .HasForeignKey(x => x.SupplierId);

            entity.HasOne(x => x.Company)
                .WithMany()
                .HasForeignKey(x => x.CompanyId);
        });

        modelBuilder.Entity<StockMovement>(entity =>
        {
            entity.ToTable("movimentacoes");

            entity.HasKey(x => x.Id);

            entity.Property(x => x.ProductId)
                .HasColumnName("produto_id")
                .IsRequired();

            entity.Property(x => x.Type)
                .HasColumnName("tipo")
                .HasConversion<string>()
                .IsRequired();

            entity.Property(x => x.Quantity)
                .HasColumnName("quantidade")
                .IsRequired();

            entity.Property(x => x.DateUtc)
                .HasColumnName("data")
                .IsRequired();

            entity.Property(x => x.UserId)
                .HasColumnName("usuario_id")
                .IsRequired();

            entity.HasOne(x => x.Product)
                .WithMany(x => x.Movements)
                .HasForeignKey(x => x.ProductId);

            entity.HasOne(x => x.User)
                .WithMany(x => x.Movements)
                .HasForeignKey(x => x.UserId);
        });

        // NOVO - EMPRESAS
        modelBuilder.Entity<Company>(entity =>
        {
            entity.ToTable("empresas");

            entity.HasKey(x => x.Id);

            entity.Property(x => x.Name)
                .HasColumnName("nome")
                .HasMaxLength(150)
                .IsRequired();

            entity.Property(x => x.Cnpj)
                .HasColumnName("cnpj")
                .HasMaxLength(18)
                .IsRequired();

            entity.Property(x => x.Email)
                .HasColumnName("email")
                .HasMaxLength(150)
                .IsRequired();

            entity.Property(x => x.PasswordHash)
                .HasColumnName("senha")
                .IsRequired();

            entity.Property(x => x.CreatedAt)
                .HasColumnName("data_criacao")
                .IsRequired();

            entity.HasIndex(x => x.Email).IsUnique();

            entity.HasIndex(x => x.Cnpj).IsUnique();
        });

        base.OnModelCreating(modelBuilder);
    }
}
