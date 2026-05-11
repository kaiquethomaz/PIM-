namespace Inventory.Api.Entities;

public class Product
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public int CategoryId { get; set; }
    public Category? Category { get; set; }
    public int SupplierId { get; set; }
    public Supplier? Supplier { get; set; }
    public decimal Price { get; set; }
    public int Quantity { get; set; }
    public ICollection<StockMovement> Movements { get; set; } = new List<StockMovement>();
}
