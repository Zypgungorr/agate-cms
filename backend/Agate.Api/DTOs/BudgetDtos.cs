using System.ComponentModel.DataAnnotations;

namespace Agate.Api.Dtos;

public class BudgetLineDto
{
    public long Id { get; set; }
    public Guid CampaignId { get; set; }
    public string CampaignName { get; set; } = string.Empty;
    public Guid? AdvertId { get; set; }
    public string? AdvertTitle { get; set; }
    public string Item { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public decimal PlannedAmount { get; set; }
    public string? Description { get; set; }
    public string? Vendor { get; set; }
    public DateOnly BookedAt { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class CreateBudgetLineDto
{
    [Required]
    public Guid CampaignId { get; set; }

    public Guid? AdvertId { get; set; }

    [Required]
    [StringLength(200)]
    public string Item { get; set; } = string.Empty;

    [Required]
    public string Category { get; set; } = "Other";

    [Required]
    public string Type { get; set; } = "Planned";

    [Range(0, 999999999)]
    public decimal Amount { get; set; }

    [Range(0, 999999999)]
    public decimal PlannedAmount { get; set; }

    public string? Description { get; set; }

    public string? Vendor { get; set; }

    public DateOnly BookedAt { get; set; } = DateOnly.FromDateTime(DateTime.Now);
}

public class UpdateBudgetLineDto
{
    [StringLength(200)]
    public string? Item { get; set; }

    public string? Category { get; set; }

    public string? Type { get; set; }

    [Range(0, 999999999)]
    public decimal? Amount { get; set; }

    [Range(0, 999999999)]
    public decimal? PlannedAmount { get; set; }

    public string? Description { get; set; }

    public string? Vendor { get; set; }

    public DateOnly? BookedAt { get; set; }
}

// Budget Analysis DTOs
public class BudgetSummaryDto
{
    public Guid CampaignId { get; set; }
    public string CampaignName { get; set; } = string.Empty;
    public decimal TotalPlanned { get; set; }
    public decimal TotalActual { get; set; }
    public decimal Variance { get; set; } // Actual - Planned
    public decimal VariancePercent { get; set; }
    public List<BudgetCategoryDto> Categories { get; set; } = new();
    public List<BudgetLineDto> RecentTransactions { get; set; } = new();
}

public class BudgetCategoryDto
{
    public string Category { get; set; } = string.Empty;
    public decimal PlannedAmount { get; set; }
    public decimal ActualAmount { get; set; }
    public decimal Variance { get; set; }
    public decimal VariancePercent { get; set; }
    public int ItemCount { get; set; }
}

public class BudgetAnalyticsDto
{
    public decimal TotalBudget { get; set; }
    public decimal SpentAmount { get; set; }
    public decimal RemainingAmount { get; set; }
    public decimal SpentPercent { get; set; }
    public List<BudgetTrendDto> MonthlyTrend { get; set; } = new();
    public List<BudgetCategoryDto> CategoryBreakdown { get; set; } = new();
    public List<BudgetVendorDto> TopVendors { get; set; } = new();
}

public class BudgetTrendDto
{
    public string Month { get; set; } = string.Empty;
    public decimal PlannedAmount { get; set; }
    public decimal ActualAmount { get; set; }
}

public class BudgetVendorDto
{
    public string Vendor { get; set; } = string.Empty;
    public decimal TotalAmount { get; set; }
    public int TransactionCount { get; set; }
}
