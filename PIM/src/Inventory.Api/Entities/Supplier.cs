namespace Inventory.Api.Entities;

public class Supplier
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Contact { get; set; } = string.Empty;
    public ICollection<Product> Products { get; set; } = new List<Product>();
}
