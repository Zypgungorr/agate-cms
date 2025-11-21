using System.ComponentModel.DataAnnotations;

namespace Agate.Api.Models;

public class Campaign
{
    public Guid Id { get; set; } = Guid.NewGuid();
    
    public Guid ClientId { get; set; }
    public Client Client { get; set; } = null!;
    
    [Required]
    public string Title { get; set; } = string.Empty;
    
    public string? Description { get; set; }
    
    public string Status { get; set; } = CampaignStatusValues.Planned;
    
    public DateOnly? StartDate { get; set; }
    public DateOnly? EndDate { get; set; }
    
    public decimal EstimatedBudget { get; set; } = 0;
    public decimal ActualCost { get; set; } = 0; // Auto-calculated from budget_lines
    
    public Guid? CreatedBy { get; set; }
    public User? Creator { get; set; }
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    
    // Navigation properties
    public ICollection<CampaignStaff> CampaignStaff { get; set; } = new List<CampaignStaff>();
    public ICollection<Advert> Adverts { get; set; } = new List<Advert>();
    public ICollection<ConceptNote> ConceptNotes { get; set; } = new List<ConceptNote>();
    public ICollection<BudgetLine> BudgetLines { get; set; } = new List<BudgetLine>();
}

public static class CampaignStatusValues
{
    public const string Planned = "planned";
    public const string Active = "active";
    public const string OnHold = "on_hold";
    public const string Completed = "completed";
    public const string Cancelled = "cancelled";
}

public class CampaignStaff
{
    public Guid CampaignId { get; set; }
    public Campaign Campaign { get; set; } = null!;
    
    public Guid StaffId { get; set; }
    public User Staff { get; set; } = null!;
    
    public string Role { get; set; } = RoleKeys.Creative;
    public DateTime AssignedAt { get; set; } = DateTime.UtcNow;
}

public class BudgetLine
{
    public long Id { get; set; }
    
    public Guid CampaignId { get; set; }
    public Campaign Campaign { get; set; } = null!;
    
    public Guid? AdvertId { get; set; }
    public Advert? Advert { get; set; }
    
    [Required]
    public string Item { get; set; } = string.Empty;
    
    [Required]
    public string Category { get; set; } = "Other"; // Creative, Media, Production, Talent, Other
    
    [Required]
    public string Type { get; set; } = "Planned"; // Planned, Actual
    
    public decimal Amount { get; set; }
    public decimal PlannedAmount { get; set; } = 0; // For comparison
    
    public string? Description { get; set; }
    public string? Vendor { get; set; } // Supplier/Agency name
    
    public DateOnly BookedAt { get; set; } = DateOnly.FromDateTime(DateTime.Now);
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
