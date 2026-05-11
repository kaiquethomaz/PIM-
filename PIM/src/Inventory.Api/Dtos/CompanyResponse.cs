namespace Inventory.Api.Dtos;

public record CompanyResponse(
    int Id,
    string Name,
    string Cnpj,
    string Email,
    DateTime CreatedAt);