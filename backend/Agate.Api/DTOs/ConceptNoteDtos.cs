using System.ComponentModel.DataAnnotations;

namespace Agate.Api.Dtos;

public class ConceptNoteDto
{
    public Guid Id { get; set; }
    public Guid CampaignId { get; set; }
    public string CampaignName { get; set; } = string.Empty;
    public Guid AuthorId { get; set; }
    public string AuthorName { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string[]? Tags { get; set; }
    public int Priority { get; set; }
    public bool IsShared { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class ConceptNoteListDto
{
    public Guid Id { get; set; }
    public Guid CampaignId { get; set; }
    public string CampaignName { get; set; } = string.Empty;
    public string AuthorName { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string[]? Tags { get; set; }
    public int Priority { get; set; }
    public bool IsShared { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class CreateConceptNoteDto
{
    [Required]
    public Guid CampaignId { get; set; }

    [Required]
    [StringLength(200)]
    public string Title { get; set; } = string.Empty;

    [Required]
    public string Content { get; set; } = string.Empty;

    public string Status { get; set; } = "Ideas";

    public string[]? Tags { get; set; }

    [Range(1, 3)]
    public int Priority { get; set; } = 1;

    public bool IsShared { get; set; } = true;
}

public class UpdateConceptNoteDto
{
    [StringLength(200)]
    public string? Title { get; set; }

    public string? Content { get; set; }

    public string? Status { get; set; }

    public string[]? Tags { get; set; }

    [Range(1, 3)]
    public int? Priority { get; set; }

    public bool? IsShared { get; set; }
}

public class UpdateConceptNoteStatusDto
{
    [Required]
    public string Status { get; set; } = string.Empty;
}
