using System.Data;
using System.Text.Json;
using Labaxurias.Infrastructure.Persistence;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Labaxurias.Api.Modules.PublicPanel;

[ApiController]
[Route("api/public-panel/settings")]
public class PublicPanelSettingsController : ControllerBase
{
    private const string SettingsKey = "public-panel-settings";
    private readonly LabaxuriasDbContext _db;

    public PublicPanelSettingsController(LabaxuriasDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<IActionResult> Get()
    {
        await EnsureSettingsTable();

        var json = await ReadSettingsJson();
        if (string.IsNullOrWhiteSpace(json))
        {
            return Ok(PublicPanelSettings.Default);
        }

        try
        {
            return Ok(JsonSerializer.Deserialize<PublicPanelSettings>(json, JsonOptions()) ?? PublicPanelSettings.Default);
        }
        catch
        {
            return Ok(PublicPanelSettings.Default);
        }
    }

    [HttpPut]
    public async Task<IActionResult> Save([FromBody] PublicPanelSettings request)
    {
        await EnsureSettingsTable();

        var settings = request.Sanitize();
        var json = JsonSerializer.Serialize(settings, JsonOptions());

        var connection = _db.Database.GetDbConnection();
        await OpenIfNeeded(connection);

        await using var command = connection.CreateCommand();
        command.CommandText = """
            INSERT INTO AppSettings (Key, Value, UpdatedAt)
            VALUES ($key, $value, $updatedAt)
            ON CONFLICT(Key) DO UPDATE SET
                Value = excluded.Value,
                UpdatedAt = excluded.UpdatedAt
            """;

        AddParameter(command, "$key", SettingsKey);
        AddParameter(command, "$value", json);
        AddParameter(command, "$updatedAt", DateTime.UtcNow.ToString("O"));
        await command.ExecuteNonQueryAsync();

        return Ok(settings);
    }

    private async Task EnsureSettingsTable()
    {
        await _db.Database.ExecuteSqlRawAsync("""
            CREATE TABLE IF NOT EXISTS AppSettings (
                Key TEXT NOT NULL PRIMARY KEY,
                Value TEXT NOT NULL,
                UpdatedAt TEXT NOT NULL
            )
            """);
    }

    private async Task<string?> ReadSettingsJson()
    {
        var connection = _db.Database.GetDbConnection();
        await OpenIfNeeded(connection);

        await using var command = connection.CreateCommand();
        command.CommandText = "SELECT Value FROM AppSettings WHERE Key = $key LIMIT 1";
        AddParameter(command, "$key", SettingsKey);

        var result = await command.ExecuteScalarAsync();
        return result as string;
    }

    private static async Task OpenIfNeeded(IDbConnection connection)
    {
        if (connection.State != ConnectionState.Open)
        {
            if (connection is System.Data.Common.DbConnection dbConnection)
            {
                await dbConnection.OpenAsync();
            }
            else
            {
                connection.Open();
            }
        }
    }

    private static void AddParameter(IDbCommand command, string name, object value)
    {
        var parameter = command.CreateParameter();
        parameter.ParameterName = name;
        parameter.Value = value;
        command.Parameters.Add(parameter);
    }

    private static JsonSerializerOptions JsonOptions() => new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    };
}

public class PublicPanelSettings
{
    public string HeaderTitle { get; set; } = "";
    public string HeaderSubtitle { get; set; } = "";
    public string BrandName { get; set; } = "";
    public string LogoPath { get; set; } = "";
    public int DisplaySeconds { get; set; }
    public string FontFamily { get; set; } = "";
    public string TextAnimation { get; set; } = "";
    public string TextColor { get; set; } = "";
    public int TextSize { get; set; }
    public int LogoSize { get; set; }
    public int RecentFontSize { get; set; }

    public static PublicPanelSettings Default => new()
    {
        HeaderTitle = "T.U.C.U.C.J.",
        HeaderSubtitle = "Sistema de Atendimento",
        BrandName = "T.U.C.U.C.J.",
        LogoPath = "logo-tucucj-transparent.png",
        DisplaySeconds = 7,
        FontFamily = "Cinzel",
        TextAnimation = "fire",
        TextColor = "#f0c581",
        TextSize = 56,
        LogoSize = 416,
        RecentFontSize = 11
    };

    public PublicPanelSettings Sanitize()
    {
        HeaderTitle = string.IsNullOrWhiteSpace(HeaderTitle) ? Default.HeaderTitle : HeaderTitle.Trim();
        HeaderSubtitle = string.IsNullOrWhiteSpace(HeaderSubtitle) ? Default.HeaderSubtitle : HeaderSubtitle.Trim();
        BrandName = string.IsNullOrWhiteSpace(BrandName) ? Default.BrandName : BrandName.Trim();
        LogoPath = string.IsNullOrWhiteSpace(LogoPath) ? Default.LogoPath : LogoPath.Trim();
        DisplaySeconds = Math.Clamp(DisplaySeconds <= 0 ? Default.DisplaySeconds : DisplaySeconds, 3, 30);
        FontFamily = string.IsNullOrWhiteSpace(FontFamily) ? Default.FontFamily : FontFamily.Trim();
        TextAnimation = string.IsNullOrWhiteSpace(TextAnimation) ? Default.TextAnimation : TextAnimation.Trim();
        TextColor = string.IsNullOrWhiteSpace(TextColor) ? Default.TextColor : TextColor.Trim();
        TextSize = Math.Clamp(TextSize <= 0 ? Default.TextSize : TextSize, 24, 120);
        LogoSize = Math.Clamp(LogoSize <= 0 ? Default.LogoSize : LogoSize, 120, 700);
        RecentFontSize = Math.Clamp(RecentFontSize <= 0 ? Default.RecentFontSize : RecentFontSize, 8, 22);
        return this;
    }
}
