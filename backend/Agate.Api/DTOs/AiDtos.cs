using System.ComponentModel.DataAnnotations;

namespace Agate.Api.DTOs;

// Request DTOs
public class CampaignSuggestionRequestDto
{
    [Required]
    public Guid CampaignId { get; set; }
    
    public string? AnalysisType { get; set; } // "performance", "ideas", "optimization"
    
    public string? AdditionalContext { get; set; }
}

public class CreativeIdeaRequestDto
{
    [Required]
    public Guid CampaignId { get; set; }
    
    public Guid? ConceptNoteId { get; set; }
    
    [Required]
    public string RequestType { get; set; } = "creative"; // "creative", "concept", "tagline", "visual"
    
    public string? Brief { get; set; }
    
    public string? TargetAudience { get; set; }
    
    public string? Tone { get; set; } // "professional", "casual", "humorous", "emotional"
}

// Response DTOs
public class AiResponseDto
{
    public string Content { get; set; } = string.Empty;
    
    public List<string> Suggestions { get; set; } = new();
    
    public Dictionary<string, object>? Metadata { get; set; }
    
    public DateTime GeneratedAt { get; set; } = DateTime.UtcNow;
}

public class CampaignSuggestionResponseDto : AiResponseDto
{
    public Guid CampaignId { get; set; }
    
    public string AnalysisType { get; set; } = string.Empty;
    
    public CampaignPerformanceAnalysis? PerformanceAnalysis { get; set; }
    
    public List<CampaignIdea> Ideas { get; set; } = new();
}

public class CreativeIdeaResponseDto : AiResponseDto
{
    public Guid CampaignId { get; set; }
    
    public Guid? ConceptNoteId { get; set; }
    
    public string RequestType { get; set; } = string.Empty;
    
    public List<CreativeIdea> Ideas { get; set; } = new();
}

// Supporting models
public class CampaignPerformanceAnalysis
{
    public string Summary { get; set; } = string.Empty;
    
    public decimal BudgetUtilization { get; set; }
    
    public int AdvertCompletionRate { get; set; }
    
    public List<string> Strengths { get; set; } = new();
    
    public List<string> Weaknesses { get; set; } = new();
    
    public List<string> Recommendations { get; set; } = new();
}

public class CampaignIdea
{
    public string Title { get; set; } = string.Empty;
    
    public string Description { get; set; } = string.Empty;
    
    public string Category { get; set; } = string.Empty; // "strategy", "content", "channel", "timing"
    
    public int Priority { get; set; } = 1; // 1-3
}

public class CreativeIdea
{
    public string Title { get; set; } = string.Empty;
    
    public string Description { get; set; } = string.Empty;
    
    public string Type { get; set; } = string.Empty; // "concept", "tagline", "visual", "story"
    
    public List<string> Tags { get; set; } = new();
    
    public string? Rationale { get; set; }
}

