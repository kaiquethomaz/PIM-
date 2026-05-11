using Inventory.Api.Enums;

namespace Inventory.Api.Entities;

public class User
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public UserRole Role { get; set; }
    public ICollection<StockMovement> Movements { get; set; } = new List<StockMovement>();
}
