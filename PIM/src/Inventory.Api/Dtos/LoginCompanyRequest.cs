namespace Inventory.Api.Dtos;

public record LoginCompanyRequest(
    string Email,
    string Password);