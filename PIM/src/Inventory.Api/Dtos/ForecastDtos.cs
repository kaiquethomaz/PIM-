namespace Inventory.Api.Dtos;

public record ForecastPointRequest(DateTime DateUtc, float Value);

public record ForecastRequest(int HorizonDays, IReadOnlyList<ForecastPointRequest> Points);

public record DemandForecastPointResponse(DateTime DateUtc, float Forecast, float LowerBound, float UpperBound);

public record DemandForecastResponse(int HorizonDays, IReadOnlyList<DemandForecastPointResponse> Points);
