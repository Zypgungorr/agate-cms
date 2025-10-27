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
    
    public string[]? Tags { get; set; }
    public bool IsShared { get; set; } = true;
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
