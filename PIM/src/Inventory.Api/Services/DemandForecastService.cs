using Inventory.Api.Data;
using Inventory.Api.Dtos;
using Inventory.Api.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.ML;
using Microsoft.ML.TimeSeries;

namespace Inventory.Api.Services;

public class DemandForecastService(AppDbContext dbContext) : IDemandForecastService
{
    private sealed class SalesData
    {
        public float Value { get; set; }
    }

    private sealed class SalesForecast
    {
        public float[] ForecastedSales { get; set; } = Array.Empty<float>();
        public float[] LowerBound { get; set; } = Array.Empty<float>();
        public float[] UpperBound { get; set; } = Array.Empty<float>();
    }

    public async Task<DemandForecastResponse?> ForecastAsync(int horizonDays, CancellationToken cancellationToken)
    {
        var movimentos = await dbContext.StockMovements
            .Where(x => x.Type == MovementType.Exit)
            .Select(x => new { x.DateUtc, x.Quantity })
            .ToListAsync(cancellationToken);

        if (movimentos.Count == 0)
        {
            return null;
        }

        var agrupadoPorDia = movimentos
            .GroupBy(x => x.DateUtc.Date)
            .ToDictionary(group => group.Key, group => (float)group.Sum(item => item.Quantity));

        var dataInicial = agrupadoPorDia.Keys.Min();
        var dataFinal = DateTime.UtcNow.Date;
        var serieDiaria = BuildDailySeries(agrupadoPorDia, dataInicial, dataFinal);

        return BuildForecast(serieDiaria, dataFinal, horizonDays);
    }

    public Task<DemandForecastResponse?> ForecastFromSeriesAsync(
        IReadOnlyList<ForecastPointRequest> points,
        int horizonDays,
        CancellationToken cancellationToken)
    {
        if (points.Count == 0)
        {
            return Task.FromResult<DemandForecastResponse?>(null);
        }

        var agrupadoPorDia = points
            .GroupBy(x => x.DateUtc.Date)
            .ToDictionary(group => group.Key, group => group.Sum(item => item.Value));

        var dataInicial = agrupadoPorDia.Keys.Min();
        var dataFinal = agrupadoPorDia.Keys.Max();
        var serieDiaria = BuildDailySeries(agrupadoPorDia, dataInicial, dataFinal);

        return Task.FromResult(BuildForecast(serieDiaria, dataFinal, horizonDays));
    }

    private static List<SalesData> BuildDailySeries(
        IReadOnlyDictionary<DateTime, float> agrupadoPorDia,
        DateTime dataInicial,
        DateTime dataFinal)
    {
        var serieDiaria = new List<SalesData>();
        for (var dia = dataInicial; dia <= dataFinal; dia = dia.AddDays(1))
        {
            agrupadoPorDia.TryGetValue(dia, out var quantidade);
            serieDiaria.Add(new SalesData { Value = quantidade });
        }

        while (serieDiaria.Count < 4)
        {
            serieDiaria.Insert(0, new SalesData { Value = 0 });
        }

        return serieDiaria;
    }

    private static DemandForecastResponse? BuildForecast(
        List<SalesData> serieDiaria,
        DateTime dataFinal,
        int horizonDays)
    {
        var trainSize = serieDiaria.Count;
        if (trainSize < 4)
        {
            return null;
        }

        var windowSize = Math.Min(7, Math.Max(2, trainSize / 2));
        var seriesLength = Math.Min(trainSize, Math.Max(windowSize + 1, 28));

        var mlContext = new MLContext();
        var dataView = mlContext.Data.LoadFromEnumerable(serieDiaria);

        var pipeline = mlContext.Forecasting.ForecastBySsa(
            outputColumnName: nameof(SalesForecast.ForecastedSales),
            inputColumnName: nameof(SalesData.Value),
            windowSize: windowSize,
            seriesLength: seriesLength,
            trainSize: trainSize,
            horizon: horizonDays,
            confidenceLevel: 0.95f,
            confidenceLowerBoundColumn: nameof(SalesForecast.LowerBound),
            confidenceUpperBoundColumn: nameof(SalesForecast.UpperBound));

        var model = pipeline.Fit(dataView);
        var transformado = model.Transform(dataView);
        var forecast = mlContext.Data.CreateEnumerable<SalesForecast>(transformado, reuseRowObject: false)
            .Last();

        var pontos = new List<DemandForecastPointResponse>();
        for (var i = 0; i < horizonDays; i++)
        {
            var dataPrevista = dataFinal.AddDays(i + 1);
            pontos.Add(new DemandForecastPointResponse(
                dataPrevista,
                forecast.ForecastedSales[i],
                forecast.LowerBound[i],
                forecast.UpperBound[i]));
        }

        return new DemandForecastResponse(horizonDays, pontos);
    }
}
