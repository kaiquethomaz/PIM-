namespace Inventory.Api.Dtos;

public record RegisterCompanyRequest(
    string Name,
    string Cnpj,
    string Email,
    string Password);