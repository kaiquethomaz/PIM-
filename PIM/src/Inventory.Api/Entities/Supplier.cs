namespace Inventory.Api.Entities;

public class Supplier
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Contact { get; set; } = string.Empty;
    public int CompanyId { get; set; }
    public Company? Company { get; set; }
    public ICollection<Product> Products { get; set; } = new List<Product>();
}
