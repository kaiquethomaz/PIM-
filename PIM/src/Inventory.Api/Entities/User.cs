using System.ComponentModel.DataAnnotations.Schema;
using Inventory.Api.Enums;

namespace Inventory.Api.Entities;

[Table("usuarios")]
public class User
{
    public int Id { get; set; }

    [Column("nome")]
    public string Name { get; set; } = string.Empty;

    [Column("email")]
    public string Email { get; set; } = string.Empty;

    [Column("senha")]
    public string PasswordHash { get; set; } = string.Empty;

    [Column("tipo")]
    public UserRole Role { get; set; }

    public ICollection<StockMovement> Movements { get; set; } = new List<StockMovement>();
}