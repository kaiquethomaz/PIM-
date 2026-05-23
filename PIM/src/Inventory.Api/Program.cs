using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Inventory.Api.Auth;
using Inventory.Api.Data;
using Inventory.Api.Dtos;
using Inventory.Api.Entities;
using Inventory.Api.Enums;
using Inventory.Api.Extensions;
using Inventory.Api.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

builder.Services.Configure<JwtOptions>(builder.Configuration.GetSection(JwtOptions.SectionName));

builder.Services.AddDbContext<AppDbContext>(options =>
{
    var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");

    options.UseMySql(
        connectionString,
        ServerVersion.AutoDetect(connectionString)
    );
});

builder.Services.AddCors(options =>
{
    options.AddPolicy("FrontEnd", policy =>
        policy.AllowAnyOrigin()
            .AllowAnyHeader()
            .AllowAnyMethod());
});

builder.Services.AddScoped<IPasswordHasher, BCryptPasswordHasher>();
builder.Services.AddScoped<IJwtTokenService, JwtTokenService>();
builder.Services.AddScoped<IStockService, StockService>();
builder.Services.AddScoped<IDemandForecastService, DemandForecastService>();

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        var jwtOptions = builder.Configuration
            .GetSection(JwtOptions.SectionName)
            .Get<JwtOptions>() ?? new JwtOptions();

        options.RequireHttpsMetadata = false;
        options.SaveToken = true;

        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,

            ValidIssuer = jwtOptions.Issuer,
            ValidAudience = jwtOptions.Audience,

            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(jwtOptions.Key)
            ),

            ClockSkew = TimeSpan.Zero
        };
    });

builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("AdminOnly", policy => policy.RequireRole(UserRole.Admin.ToString()));
    options.AddPolicy("CatalogManager", policy => policy.RequireRole(
        UserRole.Admin.ToString(),
        UserRole.Manager.ToString()));
    options.AddPolicy("ManagerOrAdmin", policy => policy.RequireRole(UserRole.Admin.ToString(), UserRole.Manager.ToString()));
    options.AddPolicy("MovementOperator", policy => policy.RequireRole(
        UserRole.Admin.ToString(),
        UserRole.Manager.ToString(),
        UserRole.Employee.ToString()));
});

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.AddSecurityDefinition("Bearer", new Microsoft.OpenApi.Models.OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = Microsoft.OpenApi.Models.SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        In = Microsoft.OpenApi.Models.ParameterLocation.Header,
        Description = "Cole SEU_TOKEN"
    });

    options.AddSecurityRequirement(new Microsoft.OpenApi.Models.OpenApiSecurityRequirement
    {
        {
            new Microsoft.OpenApi.Models.OpenApiSecurityScheme
            {
                Reference = new Microsoft.OpenApi.Models.OpenApiReference
                {
                    Type = Microsoft.OpenApi.Models.ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            new string[] {}
        }
    });
});
var app = builder.Build();
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

    Console.WriteLine(db.Database.GetConnectionString());
}

// DESABILITADO PARA USAR MYSQL REAL
// await SeedData.InitializeAsync(app.Services, app.Configuration);

app.UseSwagger();
app.UseSwaggerUI();

app.UseCors("FrontEnd");
app.UseAuthentication();
app.UseAuthorization();

app.MapGet("/", () => Results.Ok(new
{
    message = "API de estoque em execucao",
    docs = "/swagger"
})).AllowAnonymous();

var auth = app.MapGroup("/api/auth").AllowAnonymous();

auth.MapPost("/login", async (
    LoginRequest request,
    AppDbContext dbContext,
    IPasswordHasher passwordHasher,
    IJwtTokenService jwtTokenService,
    CancellationToken cancellationToken) =>
{
    var user = await dbContext.Users
        .FirstOrDefaultAsync(x => x.Email == request.Email, cancellationToken);

    if (user is null)
    {
        Console.WriteLine("Usuario nao encontrado");
        return Results.Unauthorized();
    }

    Console.WriteLine("Senha digitada: " + request.Password);
    Console.WriteLine("Hash banco: " + user.PasswordHash);

    var senhaValida = passwordHasher.Verify(
        request.Password,
        user.PasswordHash
    );

    Console.WriteLine("Senha valida? " + senhaValida);

    if (!senhaValida)
    {
        return Results.Unauthorized();
    }

    return Results.Ok(jwtTokenService.Generate(user));
});

var companies = app.MapGroup("/api/companies");

companies.MapPost("/register", async (
    RegisterCompanyRequest request,
    AppDbContext dbContext,
    IPasswordHasher passwordHasher,
    CancellationToken cancellationToken) =>
{
    var emailExists = await dbContext.Companies
        .AnyAsync(x => x.Email == request.Email, cancellationToken);

    if (emailExists)
    {
        return Results.BadRequest(new
        {
            message = "Ja existe empresa com este e-mail"
        });
    }

    var cnpjExists = await dbContext.Companies
        .AnyAsync(x => x.Cnpj == request.Cnpj, cancellationToken);

    if (cnpjExists)
    {
        return Results.BadRequest(new
        {
            message = "Ja existe empresa com este CNPJ"
        });
    }

    var company = new Company
    {
        Name = request.Name,
        Cnpj = request.Cnpj,
        Email = request.Email,
        PasswordHash = passwordHasher.Hash(request.Password)
    };

    dbContext.Companies.Add(company);
    await dbContext.SaveChangesAsync(cancellationToken);

    return Results.Created($"/api/companies/{company.Id}",
        new CompanyResponse(
            company.Id,
            company.Name,
            company.Cnpj,
            company.Email,
            company.CreatedAt));
});

companies.MapPost("/login", async (
    LoginCompanyRequest request,
    AppDbContext dbContext,
    IPasswordHasher passwordHasher,
    IJwtTokenService jwtTokenService,
    CancellationToken cancellationToken) =>
{
    var company = await dbContext.Companies
        .FirstOrDefaultAsync(x => x.Email == request.Email, cancellationToken);

    if (company is null)
    {
        return Results.Unauthorized();
    }

    var passwordValid = passwordHasher.Verify(
        request.Password,
        company.PasswordHash);

    if (!passwordValid)
    {
        return Results.Unauthorized();
    }

    var user = await dbContext.Users
        .FirstOrDefaultAsync(x => x.Email == company.Email, cancellationToken);

    if (user is null)
    {
        user = new User
        {
            Name = company.Name,
            Email = company.Email,
            PasswordHash = company.PasswordHash,
            Role = UserRole.Admin,
            CompanyId = company.Id
        };

        dbContext.Users.Add(user);
        await dbContext.SaveChangesAsync(cancellationToken);
    }

    var loginResponse = jwtTokenService.Generate(user);

    return Results.Ok(loginResponse);
});

var users = app.MapGroup("/api/users").RequireAuthorization();

users.MapPost("/", async (
    CreateUserRequest request,
    AppDbContext dbContext,
    IPasswordHasher passwordHasher,
    IAuthorizationService authorizationService,
    HttpContext httpContext,
    CancellationToken cancellationToken) =>
{
    var anyUser = await dbContext.Users.AnyAsync(cancellationToken);
    if (anyUser)
    {
        var authz = await authorizationService.AuthorizeAsync(httpContext.User, "AdminOnly");
        if (!authz.Succeeded)
        {
            return Results.Forbid();
        }
    }

    var emailExists = await dbContext.Users.AnyAsync(x => x.Email == request.Email, cancellationToken);
    if (emailExists)
    {
        return Results.BadRequest(new { message = "Ja existe usuario com este e-mail." });
    }

    int companyId;
    if (anyUser)
    {
        var currentUser = await GetCurrentUserAsync(dbContext, httpContext, cancellationToken);
        if (currentUser is null)
        {
            return Results.BadRequest(new { message = "Usuario nao encontrado." });
        }

        companyId = currentUser.CompanyId;
    }
    else
    {
        var company = await dbContext.Companies
            .OrderBy(x => x.Id)
            .FirstOrDefaultAsync(cancellationToken);

        if (company is null)
        {
            return Results.BadRequest(new
            {
                message = "Nenhuma empresa cadastrada. Cadastre uma empresa antes de criar usuarios."
            });
        }

        companyId = company.Id;
    }

    var user = new User
    {
        Name = request.Name,
        Email = request.Email,
        PasswordHash = passwordHasher.Hash(request.Password),
        Role = request.Role,
        CompanyId = companyId
    };

    dbContext.Users.Add(user);
    await dbContext.SaveChangesAsync(cancellationToken);

    return Results.Created($"/api/users/{user.Id}", new UserResponse(user.Id, user.Name, user.Email, user.Role));
}).AllowAnonymous();

users.MapGet("/", async (AppDbContext dbContext, CancellationToken cancellationToken) =>
{
    var data = await dbContext.Users
        .OrderBy(x => x.Name)
        .Select(x => new UserResponse(x.Id, x.Name, x.Email, x.Role))
        .ToListAsync(cancellationToken);

    return Results.Ok(data);
}).RequireAuthorization("AdminOnly");

users.MapPut("/{id:int}", async (
    int id,
    UpdateUserRequest request,
    AppDbContext dbContext,
    CancellationToken cancellationToken) =>
{
    var user = await dbContext.Users.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
    if (user is null)
    {
        return Results.NotFound();
    }

    var duplicateEmail = await dbContext.Users.AnyAsync(x => x.Email == request.Email && x.Id != id, cancellationToken);
    if (duplicateEmail)
    {
        return Results.BadRequest(new { message = "Ja existe usuario com este e-mail." });
    }

    user.Name = request.Name;
    user.Email = request.Email;
    user.Role = request.Role;

    await dbContext.SaveChangesAsync(cancellationToken);
    return Results.Ok(new UserResponse(user.Id, user.Name, user.Email, user.Role));
}).RequireAuthorization("AdminOnly");

var categories = app.MapGroup("/api/categories").RequireAuthorization();

categories.MapPost("/", async (
    CreateCategoryRequest request,
    AppDbContext dbContext,
    HttpContext httpContext,
    CancellationToken cancellationToken) =>
{
    var exists = await dbContext.Categories.AnyAsync(x => x.Name == request.Name, cancellationToken);
    if (exists)
    {
        return Results.BadRequest(new { message = "Categoria ja cadastrada." });
    }

    var currentUser = await GetCurrentUserAsync(dbContext, httpContext, cancellationToken);
    if (currentUser is null)
    {
        return Results.BadRequest(new { message = "Usuario nao encontrado." });
    }

    var category = new Category
    {
        Name = request.Name,
        CompanyId = currentUser.CompanyId
    };
    dbContext.Categories.Add(category);
    await dbContext.SaveChangesAsync(cancellationToken);

    return Results.Created($"/api/categories/{category.Id}", new CategoryResponse(category.Id, category.Name));
}).RequireAuthorization("CatalogManager");

categories.MapGet("/", async (AppDbContext dbContext, CancellationToken cancellationToken) =>
{
    var data = await dbContext.Categories
        .OrderBy(x => x.Name)
        .Select(x => new CategoryResponse(x.Id, x.Name))
        .ToListAsync(cancellationToken);

    return Results.Ok(data);
});

var suppliers = app.MapGroup("/api/suppliers").RequireAuthorization();

suppliers.MapPost("/", async (
    CreateSupplierRequest request,
    AppDbContext dbContext,
    HttpContext httpContext,
    CancellationToken cancellationToken) =>
{
    var currentUser = await GetCurrentUserAsync(dbContext, httpContext, cancellationToken);
    if (currentUser is null)
    {
        return Results.BadRequest(new { message = "Usuario nao encontrado." });
    }

    var supplier = new Supplier
    {
        Name = request.Name,
        Contact = request.Contact,
        CompanyId = currentUser.CompanyId
    };

    dbContext.Suppliers.Add(supplier);
    await dbContext.SaveChangesAsync(cancellationToken);

    return Results.Created($"/api/suppliers/{supplier.Id}", new SupplierResponse(supplier.Id, supplier.Name, supplier.Contact));
}).RequireAuthorization("CatalogManager");

suppliers.MapGet("/", async (AppDbContext dbContext, CancellationToken cancellationToken) =>
{
    var data = await dbContext.Suppliers
        .OrderBy(x => x.Name)
        .Select(x => new SupplierResponse(x.Id, x.Name, x.Contact))
        .ToListAsync(cancellationToken);

    return Results.Ok(data);
});

var products = app.MapGroup("/api/products").RequireAuthorization();

products.MapPost("/", async (
    CreateProductRequest request,
    AppDbContext dbContext,
    HttpContext httpContext,
    CancellationToken cancellationToken) =>
{
    var currentUser = await GetCurrentUserAsync(dbContext, httpContext, cancellationToken);
    if (currentUser is null)
    {
        return Results.BadRequest(new { message = "Usuario nao encontrado." });
    }

    var categoryExists = await dbContext.Categories.AnyAsync(x => x.Id == request.CategoryId, cancellationToken);
    var supplierExists = await dbContext.Suppliers.AnyAsync(x => x.Id == request.SupplierId, cancellationToken);

    if (!categoryExists || !supplierExists)
    {
        return Results.BadRequest(new { message = "Categoria ou fornecedor invalido." });
    }

    if (request.Quantity < 0)
    {
        return Results.BadRequest(new { message = "A quantidade inicial nao pode ser negativa." });
    }

    var product = new Product
    {
        Name = request.Name,
        CompanyId = currentUser.CompanyId,
        CategoryId = request.CategoryId,
        SupplierId = request.SupplierId,
        Price = request.Price,
        Quantity = request.Quantity
    };

    dbContext.Products.Add(product);
    await dbContext.SaveChangesAsync(cancellationToken);

    var created = await dbContext.Products
        .Include(x => x.Category)
        .Include(x => x.Supplier)
        .FirstAsync(x => x.Id == product.Id, cancellationToken);

    return Results.Created($"/api/products/{created.Id}", ToProductResponse(created));
}).RequireAuthorization("CatalogManager");

products.MapGet("/", async (AppDbContext dbContext, CancellationToken cancellationToken) =>
{
    var data = await dbContext.Products
        .Include(x => x.Category)
        .Include(x => x.Supplier)
        .OrderBy(x => x.Name)
        .ToListAsync(cancellationToken);

    return Results.Ok(data.Select(ToProductResponse));
});

products.MapPut("/{id:int}", async (
    int id,
    UpdateProductRequest request,
    AppDbContext dbContext,
    CancellationToken cancellationToken) =>
{
    var product = await dbContext.Products.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
    if (product is null)
    {
        return Results.NotFound();
    }

    var categoryExists = await dbContext.Categories.AnyAsync(x => x.Id == request.CategoryId, cancellationToken);
    var supplierExists = await dbContext.Suppliers.AnyAsync(x => x.Id == request.SupplierId, cancellationToken);

    if (!categoryExists || !supplierExists)
    {
        return Results.BadRequest(new { message = "Categoria ou fornecedor invalido." });
    }

    product.Name = request.Name;
    product.CategoryId = request.CategoryId;
    product.SupplierId = request.SupplierId;
    product.Price = request.Price;

    await dbContext.SaveChangesAsync(cancellationToken);

    var updated = await dbContext.Products
        .Include(x => x.Category)
        .Include(x => x.Supplier)
        .FirstAsync(x => x.Id == id, cancellationToken);

    return Results.Ok(ToProductResponse(updated));
}).RequireAuthorization("CatalogManager");

products.MapDelete("/{id:int}", async (int id, AppDbContext dbContext, CancellationToken cancellationToken) =>
{
    var product = await dbContext.Products.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
    if (product is null)
    {
        return Results.NotFound();
    }

    dbContext.Products.Remove(product);
    await dbContext.SaveChangesAsync(cancellationToken);
    return Results.NoContent();
}).RequireAuthorization("CatalogManager");

var movements = app.MapGroup("/api/movements").RequireAuthorization();

movements.MapPost("/", async (
    CreateMovementRequest request,
    IStockService stockService,
    AppDbContext dbContext,
    HttpContext httpContext,
    CancellationToken cancellationToken) =>
{
    try
    {
        var userId = httpContext.User.GetUserId();
        var userExists = await dbContext.Users.AnyAsync(x => x.Id == userId, cancellationToken);
        if (!userExists)
        {
            var email = httpContext.User.FindFirstValue(ClaimTypes.Email)
                ?? httpContext.User.FindFirstValue(JwtRegisteredClaimNames.Email);

            if (string.IsNullOrWhiteSpace(email))
            {
                return Results.BadRequest(new { message = "Usuario nao encontrado." });
            }

            var user = await dbContext.Users
                .FirstOrDefaultAsync(x => x.Email == email, cancellationToken);

            if (user is null)
            {
                return Results.BadRequest(new { message = "Usuario nao encontrado." });
            }

            userId = user.Id;
        }

        var movement = await stockService.RegisterMovementAsync(request, userId, cancellationToken);
        return Results.Created($"/api/movements/{movement.Id}", ToMovementResponse(movement));
    }
    catch (KeyNotFoundException ex)
    {
        return Results.NotFound(new { message = ex.Message });
    }
    catch (InvalidOperationException ex)
    {
        return Results.BadRequest(new { message = ex.Message });
    }
    catch (DbUpdateException)
    {
        return Results.BadRequest(new { message = "Usuario ou produto nao encontrado." });
    }
}).RequireAuthorization("MovementOperator");

movements.MapGet("/", async (AppDbContext dbContext, CancellationToken cancellationToken) =>
{
    var data = await dbContext.StockMovements
        .Include(x => x.Product)
        .Include(x => x.User)
        .OrderByDescending(x => x.DateUtc)
        .ToListAsync(cancellationToken);

    return Results.Ok(data.Select(ToMovementResponse));
});

var maintenance = app.MapGroup("/api/maintenance").RequireAuthorization("AdminOnly");

maintenance.MapDelete("/sales", async (AppDbContext dbContext, CancellationToken cancellationToken) =>
{
    var sales = await dbContext.StockMovements
        .Where(x => x.Type == MovementType.Exit)
        .Include(x => x.Product)
        .ToListAsync(cancellationToken);

    if (sales.Count == 0)
    {
        return Results.Ok(new { message = "Nenhuma venda encontrada para limpeza." });
    }

    foreach (var sale in sales)
    {
        if (sale.Product is not null)
        {
            sale.Product.Quantity += sale.Quantity;
        }
    }

    dbContext.StockMovements.RemoveRange(sales);
    await dbContext.SaveChangesAsync(cancellationToken);

    return Results.Ok(new { message = "Vendas removidas com sucesso." });
});

maintenance.MapDelete("/inventory", async (AppDbContext dbContext, CancellationToken cancellationToken) =>
{
    var movements = await dbContext.StockMovements.ToListAsync(cancellationToken);
    var products = await dbContext.Products.ToListAsync(cancellationToken);

    if (movements.Count == 0 && products.Count == 0)
    {
        return Results.Ok(new { message = "Nenhum item de estoque encontrado para limpeza." });
    }

    if (movements.Count > 0)
    {
        dbContext.StockMovements.RemoveRange(movements);
    }

    if (products.Count > 0)
    {
        dbContext.Products.RemoveRange(products);
    }

    await dbContext.SaveChangesAsync(cancellationToken);

    return Results.Ok(new { message = "Estoque removido com sucesso." });
});

var reports = app.MapGroup("/api/reports").RequireAuthorization("ManagerOrAdmin");

reports.MapGet("/stock", async (AppDbContext dbContext, CancellationToken cancellationToken) =>
{
    var data = await dbContext.Products
        .Include(x => x.Category)
        .Include(x => x.Supplier)
        .OrderBy(x => x.Name)
        .Select(x => new StockReportItemResponse(
            x.Id,
            x.Name,
            x.Category!.Name,
            x.Supplier!.Name,
            x.Quantity,
            x.Price,
            x.Quantity < 5))
        .ToListAsync(cancellationToken);

    return Results.Ok(data);
});

reports.MapGet("/movements", async (DateTime? startUtc, DateTime? endUtc, AppDbContext dbContext, CancellationToken cancellationToken) =>
{
    var query = dbContext.StockMovements
        .Include(x => x.Product)
        .Include(x => x.User)
        .AsQueryable();

    if (startUtc.HasValue)
    {
        query = query.Where(x => x.DateUtc >= startUtc.Value);
    }

    if (endUtc.HasValue)
    {
        query = query.Where(x => x.DateUtc <= endUtc.Value);
    }

    var data = await query
        .OrderByDescending(x => x.DateUtc)
        .ToListAsync(cancellationToken);

    return Results.Ok(data.Select(ToMovementResponse));
});

reports.MapGet("/top-selling", async (AppDbContext dbContext, CancellationToken cancellationToken) =>
{
    var data = await dbContext.StockMovements
        .Where(x => x.Type == MovementType.Exit)
        .Include(x => x.Product)
        .ToListAsync(cancellationToken);

    var result = data
        .GroupBy(x => new { x.ProductId, Product = x.Product!.Name })
        .Select(group => new TopSellingProductResponse(group.Key.ProductId, group.Key.Product, group.Sum(x => x.Quantity)))
        .OrderByDescending(x => x.TotalSold)
        .ToList();

    return Results.Ok(result);
});

reports.MapGet("/demand-forecast", async (
    int? days,
    IDemandForecastService demandForecastService,
    CancellationToken cancellationToken) =>
{
    var horizonDays = days ?? 7;

    if (horizonDays <= 0 || horizonDays > 30)
    {
        return Results.BadRequest(new { message = "O numero de dias deve estar entre 1 e 30." });
    }

    var resultado = await demandForecastService.ForecastAsync(horizonDays, cancellationToken);
    if (resultado is null)
    {
        return Results.BadRequest(new { message = "Dados insuficientes para gerar previsao de demanda." });
    }

    return Results.Ok(resultado);
});

reports.MapPost("/demand-forecast", async (
    ForecastRequest request,
    IDemandForecastService demandForecastService,
    CancellationToken cancellationToken) =>
{
    var horizonDays = request.HorizonDays <= 0 ? 7 : request.HorizonDays;

    if (horizonDays <= 0 || horizonDays > 30)
    {
        return Results.BadRequest(new { message = "O numero de dias deve estar entre 1 e 30." });
    }

    if (request.Points.Count == 0)
    {
        return Results.BadRequest(new { message = "Informe dados para gerar previsao." });
    }

    var resultado = await demandForecastService
        .ForecastFromSeriesAsync(request.Points, horizonDays, cancellationToken);

    if (resultado is null)
    {
        return Results.BadRequest(new { message = "Dados insuficientes para gerar previsao de demanda." });
    }

    return Results.Ok(resultado);
});

reports.MapGet("/sales-forecast", async (
    int? days,
    AppDbContext dbContext,
    IDemandForecastService demandForecastService,
    CancellationToken cancellationToken) =>
{
    var horizonDays = days ?? 7;

    if (horizonDays <= 0 || horizonDays > 30)
    {
        return Results.BadRequest(new { message = "O numero de dias deve estar entre 1 e 30." });
    }

    var pontos = await dbContext.StockMovements
        .Where(x => x.Type == MovementType.Exit)
        .GroupBy(x => x.DateUtc.Date)
        .Select(group => new ForecastPointRequest(group.Key, group.Count()))
        .ToListAsync(cancellationToken);

    if (pontos.Count == 0)
    {
        return Results.BadRequest(new { message = "Dados insuficientes para gerar previsao de vendas." });
    }

    var resultado = await demandForecastService
        .ForecastFromSeriesAsync(pontos, horizonDays, cancellationToken);

    if (resultado is null)
    {
        return Results.BadRequest(new { message = "Dados insuficientes para gerar previsao de vendas." });
    }

    return Results.Ok(resultado);
});

reports.MapPost("/sales-forecast", async (
    ForecastRequest request,
    IDemandForecastService demandForecastService,
    CancellationToken cancellationToken) =>
{
    var horizonDays = request.HorizonDays <= 0 ? 7 : request.HorizonDays;

    if (horizonDays <= 0 || horizonDays > 30)
    {
        return Results.BadRequest(new { message = "O numero de dias deve estar entre 1 e 30." });
    }

    if (request.Points.Count == 0)
    {
        return Results.BadRequest(new { message = "Informe dados para gerar previsao." });
    }

    var resultado = await demandForecastService
        .ForecastFromSeriesAsync(request.Points, horizonDays, cancellationToken);

    if (resultado is null)
    {
        return Results.BadRequest(new { message = "Dados insuficientes para gerar previsao de vendas." });
    }

    return Results.Ok(resultado);
});

reports.MapGet("/revenue-forecast", async (
    int? days,
    AppDbContext dbContext,
    IDemandForecastService demandForecastService,
    CancellationToken cancellationToken) =>
{
    var horizonDays = days ?? 7;

    if (horizonDays <= 0 || horizonDays > 30)
    {
        return Results.BadRequest(new { message = "O numero de dias deve estar entre 1 e 30." });
    }

    var pontos = await dbContext.StockMovements
        .Where(x => x.Type == MovementType.Exit)
        .Include(x => x.Product)
        .ToListAsync(cancellationToken);

    var revenues = pontos
        .GroupBy(x => x.DateUtc.Date)
        .Select(group => new ForecastPointRequest(
            group.Key,
            (float)group.Sum(x => (decimal)x.Quantity * x.Product!.Price)))
        .ToList();

    if (revenues.Count == 0)
    {
        return Results.BadRequest(new { message = "Dados insuficientes para gerar previsao de faturamento." });
    }

    var resultado = await demandForecastService
        .ForecastFromSeriesAsync(revenues, horizonDays, cancellationToken);

    if (resultado is null)
    {
        return Results.BadRequest(new { message = "Dados insuficientes para gerar previsao de faturamento." });
    }

    return Results.Ok(resultado);
});

reports.MapPost("/revenue-forecast", async (
    ForecastRequest request,
    IDemandForecastService demandForecastService,
    CancellationToken cancellationToken) =>
{
    var horizonDays = request.HorizonDays <= 0 ? 7 : request.HorizonDays;

    if (horizonDays <= 0 || horizonDays > 30)
    {
        return Results.BadRequest(new { message = "O numero de dias deve estar entre 1 e 30." });
    }

    if (request.Points.Count == 0)
    {
        return Results.BadRequest(new { message = "Informe dados para gerar previsao." });
    }

    var resultado = await demandForecastService
        .ForecastFromSeriesAsync(request.Points, horizonDays, cancellationToken);

    if (resultado is null)
    {
        return Results.BadRequest(new { message = "Dados insuficientes para gerar previsao de faturamento." });
    }

    return Results.Ok(resultado);
});

app.Run();

static ProductResponse ToProductResponse(Product product) =>
    new(
        product.Id,
        product.Name,
        product.CategoryId,
        product.Category?.Name ?? string.Empty,
        product.SupplierId,
        product.Supplier?.Name ?? string.Empty,
        product.Price,
        product.Quantity,
        product.Quantity < 5);

static MovementResponse ToMovementResponse(StockMovement movement) =>
    new(
        movement.Id,
        movement.ProductId,
        movement.Product?.Name ?? string.Empty,
        movement.Type,
        movement.Quantity,
        movement.DateUtc,
        movement.UserId,
        movement.User?.Name ?? string.Empty,
        movement.User?.Role);

static async Task<User?> GetCurrentUserAsync(
    AppDbContext dbContext,
    HttpContext httpContext,
    CancellationToken cancellationToken)
{
    var userIdValue = httpContext.User.FindFirstValue(ClaimTypes.NameIdentifier);
    if (int.TryParse(userIdValue, out var userId))
    {
        var user = await dbContext.Users
            .FirstOrDefaultAsync(x => x.Id == userId, cancellationToken);

        if (user is not null)
        {
            return user;
        }
    }

    var email = httpContext.User.FindFirstValue(ClaimTypes.Email)
        ?? httpContext.User.FindFirstValue(JwtRegisteredClaimNames.Email);

    if (string.IsNullOrWhiteSpace(email))
    {
        return null;
    }

    return await dbContext.Users
        .FirstOrDefaultAsync(x => x.Email == email, cancellationToken);
}

public partial class Program;
