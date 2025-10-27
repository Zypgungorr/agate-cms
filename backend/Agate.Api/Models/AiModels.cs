using System.ComponentModel.DataAnnotations;
using System.Text.Json;

namespace Agate.Api.Models;

public class AiSuggestion
{
    public Guid Id { get; set; } = Guid.NewGuid();
    
    public Guid? CampaignId { get; set; }
    public Campaign? Campaign { get; set; }
    
    public Guid? AuthorUserId { get; set; }
    public User? AuthorUser { get; set; }
    
    [Required]
    public string Kind { get; set; } = string.Empty; // ideas | summary | recommendations
    
    [Required]
    public JsonDocument PromptSnapshot { get; set; } = null!; // Context + prompt
    
    [Required]
    public JsonDocument Result { get; set; } = null!; // Model output (structured)
    
    public bool? Accepted { get; set; } // User acceptance
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public class AiAuditLog
{
    public long Id { get; set; }
    
    public Guid? UserId { get; set; }
    public User? User { get; set; }
    
    [Required]
    public string Route { get; set; } = string.Empty; // /ai/ideas, /ai/summary etc.
    
    public Guid? CampaignId { get; set; }
    public Campaign? Campaign { get; set; }
    
    public int? LatencyMs { get; set; }
    public int? StatusCode { get; set; }
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
