using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using Inventory.Api.Dtos;
using Inventory.Api.Enums;

namespace Inventory.Api.Tests;

public class ApiTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly CustomWebApplicationFactory factory;

    public ApiTests(CustomWebApplicationFactory factory)
    {
        this.factory = factory;
        // Garante um banco limpo e repovoado antes de cada teste.
        factory.ResetState();
    }

    [Fact]
    public async Task Login_ReturnsJwtToken()
    {
        var client = factory.CreateClient();

        var response = await client.PostAsJsonAsync("/api/auth/login", new LoginRequest("admin@test.com", "Admin@123"));

        response.EnsureSuccessStatusCode();
        var payload = await response.Content.ReadFromJsonAsync<LoginResponse>();
        Assert.False(string.IsNullOrWhiteSpace(payload?.Token));
    }

    [Fact]
    public async Task Admin_Can_Create_Update_And_Delete_Product()
    {
        var client = factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", await LoginAsync(client, "admin@test.com", "Admin@123"));

        var createResponse = await client.PostAsJsonAsync("/api/products", new CreateProductRequest("Teclado", 1, 1, 150m, 8));
        createResponse.EnsureSuccessStatusCode();

        var created = await createResponse.Content.ReadFromJsonAsync<ProductResponse>();
        Assert.NotNull(created);

        var updateResponse = await client.PutAsJsonAsync($"/api/products/{created!.Id}", new UpdateProductRequest("Teclado RGB", 1, 1, 180m));
        updateResponse.EnsureSuccessStatusCode();

        var deleteResponse = await client.DeleteAsync($"/api/products/{created.Id}");
        Assert.Equal(HttpStatusCode.NoContent, deleteResponse.StatusCode);
    }

    [Fact]
    public async Task Admin_Can_Create_Employee_User()
    {
        var client = factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", await LoginAsync(client, "admin@test.com", "Admin@123"));

        var response = await client.PostAsJsonAsync("/api/users", new CreateUserRequest("Colaborador", "colaborador@test.com", "Colaborador@123", UserRole.Employee));

        response.EnsureSuccessStatusCode();

        var created = await response.Content.ReadFromJsonAsync<UserResponse>();
        Assert.NotNull(created);
        Assert.Equal(UserRole.Employee, created!.Role);
    }

    [Fact]
    public async Task Admin_Can_Clear_Sales_And_Restore_Stock()
    {
        var client = factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", await LoginAsync(client, "employee@test.com", "Employee@123"));

        var saleResponse = await client.PostAsJsonAsync("/api/movements", new CreateMovementRequest(1, MovementType.Exit, 2));
        saleResponse.EnsureSuccessStatusCode();

        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", await LoginAsync(client, "admin@test.com", "Admin@123"));

        var clearResponse = await client.DeleteAsync("/api/maintenance/sales");
        clearResponse.EnsureSuccessStatusCode();

        var products = await client.GetFromJsonAsync<List<ProductResponse>>("/api/products");
        var movements = await client.GetFromJsonAsync<List<MovementResponse>>("/api/movements");

        Assert.NotNull(products);
        Assert.NotNull(movements);
        Assert.Equal(10, products!.Single(x => x.Id == 1).Quantity);
        Assert.Empty(movements!);
    }

    [Fact]
    public async Task Admin_Can_Clear_Inventory()
    {
        var client = factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", await LoginAsync(client, "employee@test.com", "Employee@123"));

        var movementResponse = await client.PostAsJsonAsync("/api/movements", new CreateMovementRequest(1, MovementType.Entry, 1));
        movementResponse.EnsureSuccessStatusCode();

        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", await LoginAsync(client, "admin@test.com", "Admin@123"));

        var clearResponse = await client.DeleteAsync("/api/maintenance/inventory");
        clearResponse.EnsureSuccessStatusCode();

        var products = await client.GetFromJsonAsync<List<ProductResponse>>("/api/products");
        var movements = await client.GetFromJsonAsync<List<MovementResponse>>("/api/movements");

        Assert.NotNull(products);
        Assert.NotNull(movements);
        Assert.Empty(products!);
        Assert.Empty(movements!);
    }

    [Fact]
    public async Task Employee_Cannot_Access_Manager_Report()
    {
        var client = factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", await LoginAsync(client, "employee@test.com", "Employee@123"));

        var response = await client.GetAsync("/api/reports/stock");

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task Manager_Can_Create_Product()
    {
        // A politica "CatalogManager" concede a gestao de catalogo a Admin e Manager.
        var client = factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", await LoginAsync(client, "manager@test.com", "Manager@123"));

        var response = await client.PostAsJsonAsync("/api/products", new CreateProductRequest("Headset", 1, 1, 300m, 4));

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
    }

    [Fact]
    public async Task Employee_Cannot_Create_Product()
    {
        // Funcionario nao tem permissao de gestao de catalogo.
        var client = factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", await LoginAsync(client, "employee@test.com", "Employee@123"));

        var response = await client.PostAsJsonAsync("/api/products", new CreateProductRequest("Headset", 1, 1, 300m, 4));

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task Stock_Cannot_Become_Negative()
    {
        var client = factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", await LoginAsync(client, "employee@test.com", "Employee@123"));

        var response = await client.PostAsJsonAsync("/api/movements", new CreateMovementRequest(1, MovementType.Exit, 999));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Employee_Can_Register_Entry_And_Exit_Movement()
    {
        var client = factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", await LoginAsync(client, "employee@test.com", "Employee@123"));

        var entryResponse = await client.PostAsJsonAsync("/api/movements", new CreateMovementRequest(1, MovementType.Entry, 2));
        entryResponse.EnsureSuccessStatusCode();

        var exitResponse = await client.PostAsJsonAsync("/api/movements", new CreateMovementRequest(1, MovementType.Exit, 1));
        exitResponse.EnsureSuccessStatusCode();

        var products = await client.GetFromJsonAsync<List<ProductResponse>>("/api/products");
        Assert.NotNull(products);
        Assert.Equal(11, products!.Single(x => x.Id == 1).Quantity);
    }

    [Fact]
    public async Task Sale_Persists_Payment_Method()
    {
        var client = factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", await LoginAsync(client, "employee@test.com", "Employee@123"));

        var response = await client.PostAsJsonAsync("/api/movements", new CreateMovementRequest(1, MovementType.Exit, 1, "PIX"));
        response.EnsureSuccessStatusCode();

        var movements = await client.GetFromJsonAsync<List<MovementResponse>>("/api/movements");
        Assert.NotNull(movements);
        Assert.Contains(movements!, m => m.Type == MovementType.Exit && m.PaymentMethod == "PIX");
    }

    [Fact]
    public async Task Demand_Forecast_Returns_Data_With_Short_History()
    {
        var client = factory.CreateClient();
        await RegistrarVendaAsync(client);

        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", await LoginAsync(client, "admin@test.com", "Admin@123"));

        var response = await client.GetAsync("/api/reports/demand-forecast?days=7");

        response.EnsureSuccessStatusCode();
        var payload = await response.Content.ReadFromJsonAsync<DemandForecastResponse>();
        Assert.NotNull(payload);
        Assert.Equal(7, payload!.Points.Count);
    }

    [Fact]
    public async Task Sales_Forecast_Returns_Data_With_Short_History()
    {
        var client = factory.CreateClient();
        await RegistrarVendaAsync(client);

        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", await LoginAsync(client, "admin@test.com", "Admin@123"));

        var response = await client.GetAsync("/api/reports/sales-forecast?days=7");

        response.EnsureSuccessStatusCode();
        var payload = await response.Content.ReadFromJsonAsync<DemandForecastResponse>();
        Assert.NotNull(payload);
        Assert.Equal(7, payload!.Points.Count);
    }

    [Fact]
    public async Task Revenue_Forecast_Returns_Data_With_Short_History()
    {
        var client = factory.CreateClient();
        await RegistrarVendaAsync(client);

        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", await LoginAsync(client, "admin@test.com", "Admin@123"));

        var response = await client.GetAsync("/api/reports/revenue-forecast?days=7");

        response.EnsureSuccessStatusCode();
        var payload = await response.Content.ReadFromJsonAsync<DemandForecastResponse>();
        Assert.NotNull(payload);
        Assert.Equal(7, payload!.Points.Count);
    }

    private static async Task<string> LoginAsync(HttpClient client, string email, string password)
    {
        var response = await client.PostAsJsonAsync("/api/auth/login", new LoginRequest(email, password));
        response.EnsureSuccessStatusCode();

        var payload = await response.Content.ReadFromJsonAsync<LoginResponse>();
        return payload!.Token;
    }

    private static async Task RegistrarVendaAsync(HttpClient client)
    {
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", await LoginAsync(client, "employee@test.com", "Employee@123"));

        var response = await client.PostAsJsonAsync("/api/movements", new CreateMovementRequest(1, MovementType.Exit, 1));
        response.EnsureSuccessStatusCode();
    }
}
