using Inventory.Api.Data;
using Inventory.Api.Dtos;
using Inventory.Api.Entities;
using Inventory.Api.Enums;
using Microsoft.EntityFrameworkCore;

namespace Inventory.Api.Services;

public class StockService(AppDbContext dbContext) : IStockService
{
    public async Task<StockMovement> RegisterMovementAsync(CreateMovementRequest request, int userId, CancellationToken cancellationToken)
    {
        if (request.Quantity <= 0)
        {
            throw new InvalidOperationException("A quantidade da movimentacao deve ser maior que zero.");
        }

        var product = await dbContext.Products.FirstOrDefaultAsync(p => p.Id == request.ProductId, cancellationToken);
        if (product is null)
        {
            throw new KeyNotFoundException("Produto nao encontrado.");
        }

        if (request.Type == MovementType.Exit && product.Quantity < request.Quantity)
        {
            throw new InvalidOperationException("Nao e permitido deixar o estoque negativo.");
        }

        product.Quantity += request.Type == MovementType.Entry ? request.Quantity : -request.Quantity;

        var movement = new StockMovement
        {
            ProductId = product.Id,
            Quantity = request.Quantity,
            Type = request.Type,
            UserId = userId,
            DateUtc = DateTime.UtcNow
        };

        dbContext.StockMovements.Add(movement);
        await dbContext.SaveChangesAsync(cancellationToken);

        return await dbContext.StockMovements
            .Include(m => m.Product)
            .Include(m => m.User)
            .FirstAsync(m => m.Id == movement.Id, cancellationToken);
    }
}
