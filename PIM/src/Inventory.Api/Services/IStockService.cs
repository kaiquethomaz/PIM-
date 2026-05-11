using Inventory.Api.Dtos;
using Inventory.Api.Entities;

namespace Inventory.Api.Services;

public interface IStockService
{
    Task<StockMovement> RegisterMovementAsync(CreateMovementRequest request, int userId, CancellationToken cancellationToken);
}
