using Inventory.Api.Enums;

namespace Inventory.Api.Dtos;

public record LoginRequest(string Email, string Password);

public record LoginResponse(string Token, DateTime ExpiresAtUtc, UserResponse User);

public record CreateUserRequest(string Name, string Email, string Password, UserRole Role);

public record UpdateUserRequest(string Name, string Email, UserRole Role);

public record UserResponse(int Id, string Name, string Email, UserRole Role);
