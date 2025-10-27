using System.ComponentModel.DataAnnotations;

namespace Agate.Api.Models;

public class Advert
{
    public Guid Id { get; set; } = Guid.NewGuid();
    
    public Guid CampaignId { get; set; }
    public Campaign Campaign { get; set; } = null!;
    
    [Required]
    public string Title { get; set; } = string.Empty;
    
    [Required]
    public string Channel { get; set; } = string.Empty; // Instagram, TV, Billboard, etc.
    
    public string Status { get; set; } = AdvertStatusValues.Backlog;
    
    public DateTime? PublishStart { get; set; }
    public DateTime? PublishEnd { get; set; }
    
    public Guid? OwnerId { get; set; } // Responsible creative
    public User? Owner { get; set; }
    
    public decimal Cost { get; set; } = 0;
    public string? Notes { get; set; }
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    
    // Navigation properties
    public ICollection<BudgetLine> BudgetLines { get; set; } = new List<BudgetLine>();
}

public static class AdvertStatusValues
{
    public const string Backlog = "backlog";
    public const string InProgress = "in_progress";
    public const string Ready = "ready";
    public const string Scheduled = "scheduled";
    public const string Completed = "completed";
    public const string Cancelled = "cancelled";
}
