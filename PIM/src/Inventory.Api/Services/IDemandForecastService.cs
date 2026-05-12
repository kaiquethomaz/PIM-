using Inventory.Api.Dtos;

namespace Inventory.Api.Services;

public interface IDemandForecastService
{
    Task<DemandForecastResponse?> ForecastAsync(int horizonDays, CancellationToken cancellationToken);
    Task<DemandForecastResponse?> ForecastFromSeriesAsync(
        IReadOnlyList<ForecastPointRequest> points,
        int horizonDays,
        CancellationToken cancellationToken);
}
