using System.ComponentModel.DataAnnotations;

namespace Agate.Api.DTOs;

public class CreateCampaignDto
{
    [Required]
    public Guid ClientId { get; set; }
    
    [Required]
    [MaxLength(200)]
    public string Title { get; set; } = string.Empty;
    
    public string? Description { get; set; }
    
    public DateOnly? StartDate { get; set; }
    public DateOnly? EndDate { get; set; }
    
    [Range(0, double.MaxValue)]
    public decimal EstimatedBudget { get; set; } = 0;
}

public class UpdateCampaignDto
{
    [Required]
    [MaxLength(200)]
    public string Title { get; set; } = string.Empty;
    
    public string? Description { get; set; }
    
    [Required]
    public string Status { get; set; } = string.Empty;
    
    public DateOnly? StartDate { get; set; }
    public DateOnly? EndDate { get; set; }
    
    [Range(0, double.MaxValue)]
    public decimal EstimatedBudget { get; set; } = 0;
}

public class CampaignDto
{
    public Guid Id { get; set; }
    public Guid ClientId { get; set; }
    public string ClientName { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateOnly? StartDate { get; set; }
    public DateOnly? EndDate { get; set; }
    public decimal EstimatedBudget { get; set; }
    public decimal ActualCost { get; set; }
    public decimal BudgetVariance => ActualCost - EstimatedBudget;
    public string? CreatedByName { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    
    // Campaign statistics
    public int TotalAdverts { get; set; }
    public int CompletedAdverts { get; set; }
    public int ActiveAdverts { get; set; }
}

public class CampaignListDto
{
    public Guid Id { get; set; }
    public string ClientName { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public DateOnly? StartDate { get; set; }
    public DateOnly? EndDate { get; set; }
    public decimal EstimatedBudget { get; set; }
    public decimal ActualCost { get; set; }
    public decimal BudgetVariance => ActualCost - EstimatedBudget;
    public int TotalAdverts { get; set; }
    public DateTime UpdatedAt { get; set; }
}
