namespace Inventory.Api.Dtos;

public record CreateCategoryRequest(string Name);

public record CategoryResponse(int Id, string Name);

public record CreateSupplierRequest(string Name, string Contact);

public record SupplierResponse(int Id, string Name, string Contact);

public record CreateProductRequest(string Name, int CategoryId, int SupplierId, decimal Price, int Quantity);

public record UpdateProductRequest(string Name, int CategoryId, int SupplierId, decimal Price);

public record ProductResponse(
    int Id,
    string Name,
    int CategoryId,
    string Category,
    int SupplierId,
    string Supplier,
    decimal Price,
    int Quantity,
    bool IsLowStock);
