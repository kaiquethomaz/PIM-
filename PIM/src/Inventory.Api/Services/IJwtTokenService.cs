using Inventory.Api.Dtos;
using Inventory.Api.Entities;

namespace Inventory.Api.Services;

public interface IJwtTokenService
{
    LoginResponse Generate(User user);
}
