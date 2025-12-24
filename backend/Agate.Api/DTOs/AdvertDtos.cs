using System.ComponentModel.DataAnnotations;

namespace Agate.Api.Dtos;

public record AdvertDto
{
    public Guid Id { get; init; }
    public Guid CampaignId { get; init; }
    public string CampaignTitle { get; init; } = string.Empty;
    public string Title { get; init; } = string.Empty;
    public string Channel { get; init; } = string.Empty;
    public string Status { get; init; } = string.Empty;
    public DateTime? PublishStart { get; init; }
    public DateTime? PublishEnd { get; init; }
    public Guid? OwnerId { get; init; }
    public string? OwnerName { get; init; }
    public decimal Cost { get; init; }
    public string? Notes { get; init; }
    public DateTime CreatedAt { get; init; }
    public DateTime UpdatedAt { get; init; }
}

public record CreateAdvertDto
{
    [Required]
    public Guid CampaignId { get; init; }
    
    [Required]
    [MaxLength(200)]
    public string Title { get; init; } = string.Empty;
    
    [Required]
    [MaxLength(100)]
    public string Channel { get; init; } = string.Empty;
    
    public string Status { get; init; } = Models.AdvertStatusValues.Backlog;
    
    public DateTime? PublishStart { get; init; }
    public DateTime? PublishEnd { get; init; }
    
    public Guid? OwnerId { get; init; }
    
    [Range(0, double.MaxValue)]
    public decimal Cost { get; init; }
    
    [MaxLength(1000)]
    public string? Notes { get; init; }
}

public record UpdateAdvertDto
{
    [Required]
    [MaxLength(200)]
    public string Title { get; init; } = string.Empty;
    
    [Required]
    [MaxLength(100)]
    public string Channel { get; init; } = string.Empty;
    
    [Required]
    public string Status { get; init; } = string.Empty;
    
    public DateTime? PublishStart { get; init; }
    public DateTime? PublishEnd { get; init; }
    
    public Guid? OwnerId { get; init; }
    
    [Range(0, double.MaxValue)]
    public decimal Cost { get; init; }
    
    [MaxLength(1000)]
    public string? Notes { get; init; }
}

public record AdvertListDto
{
    public Guid Id { get; init; }
    public Guid CampaignId { get; init; }
    public string Title { get; init; } = string.Empty;
    public string CampaignTitle { get; init; } = string.Empty;
    public string Channel { get; init; } = string.Empty;
    public string Status { get; init; } = string.Empty;
    public decimal Cost { get; init; }
    public string? OwnerName { get; init; }
    public DateTime? PublishStart { get; init; }
    public DateTime UpdatedAt { get; init; }
}
