using System.ComponentModel.DataAnnotations;

namespace Agate.Api.Models;

public class ConceptNote
{
    public Guid Id { get; set; } = Guid.NewGuid();
    
    public Guid CampaignId { get; set; }
    public Campaign Campaign { get; set; } = null!;
    
    public Guid AuthorId { get; set; }
    public User Author { get; set; } = null!;
    
    [Required]
    public string Title { get; set; } = string.Empty;
    
    [Required]
    public string Content { get; set; } = string.Empty;
    
    [Required]
    public string Status { get; set; } = "Ideas"; // Ideas, InReview, Approved, Archived
    
    public string[]? Tags { get; set; }
    public int Priority { get; set; } = 1; // 1=Low, 2=Medium, 3=High
    public bool IsShared { get; set; } = true;
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
