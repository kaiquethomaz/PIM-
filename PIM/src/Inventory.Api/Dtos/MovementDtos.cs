using Inventory.Api.Enums;

namespace Inventory.Api.Dtos;

public record CreateMovementRequest(int ProductId, MovementType Type, int Quantity, string? PaymentMethod = null);

public record MovementResponse(
    int Id,
    int ProductId,
    string Product,
    MovementType Type,
    int Quantity,
    DateTime DateUtc,
    int UserId,
    string User,
    UserRole? UserRole,
    string? PaymentMethod);

public record StockReportItemResponse(
    int ProductId,
    string Product,
    string Category,
    string Supplier,
    int Quantity,
    decimal Price,
    bool IsLowStock);

public record TopSellingProductResponse(int ProductId, string Product, int TotalSold);
