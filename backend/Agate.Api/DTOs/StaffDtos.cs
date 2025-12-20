using System.ComponentModel.DataAnnotations;

namespace Agate.Api.DTOs;

// Staff list for dropdowns and tables
public class StaffListDto
{
    public Guid Id { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? Title { get; set; }
    public string? Office { get; set; }
    public bool IsActive { get; set; }
    public List<string> Roles { get; set; } = new();
    
    // Statistics
    public int ActiveCampaigns { get; set; }
    public int TotalCampaigns { get; set; }
    public int ClientContacts { get; set; }
}

// Detailed staff information
public class StaffDto
{
    public Guid Id { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? Title { get; set; }
    public string? Office { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    
    // Roles
    public List<string> Roles { get; set; } = new();
    
    // Statistics
    public int ActiveCampaigns { get; set; }
    public int CompletedCampaigns { get; set; }
    public int TotalCampaigns { get; set; }
    public int ClientContacts { get; set; }
    public int PrimaryClientContacts { get; set; }
    public int ConceptNotes { get; set; }
    public int OwnedAdverts { get; set; }
    
    // Current assignments
    public List<CampaignAssignmentDto> CampaignAssignments { get; set; } = new();
    public List<ClientContactDto> ClientAssignments { get; set; } = new();
}

// For creating new staff members
public class CreateStaffDto
{
    [Required]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;
    
    [Required]
    [MinLength(8)]
    public string Password { get; set; } = string.Empty;
    
    [Required]
    [MaxLength(200)]
    public string FullName { get; set; } = string.Empty;
    
    public string? Title { get; set; }
    public string? Office { get; set; }
    
    [Required]
    public List<string> Roles { get; set; } = new();
}

// For updating staff information
public class UpdateStaffDto
{
    [Required]
    [MaxLength(200)]
    public string FullName { get; set; } = string.Empty;
    
    public string? Title { get; set; }
    public string? Office { get; set; }
    public bool IsActive { get; set; }
    
    [Required]
    public List<string> Roles { get; set; } = new();
}

// For changing staff password
public class ChangeStaffPasswordDto
{
    [Required]
    [MinLength(8)]
    public string NewPassword { get; set; } = string.Empty;
}

// Campaign assignment info
public class CampaignAssignmentDto
{
    public Guid CampaignId { get; set; }
    public string CampaignTitle { get; set; } = string.Empty;
    public string CampaignStatus { get; set; } = string.Empty;
    public string ClientName { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public DateTime AssignedAt { get; set; }
}

// Client contact assignment info
public class ClientContactDto
{
    public Guid ClientId { get; set; }
    public string ClientName { get; set; } = string.Empty;
    public bool IsPrimary { get; set; }
    public DateTime AssignedAt { get; set; }
}

// For assigning staff to campaigns
public class AssignStaffToCampaignDto
{
    [Required]
    public Guid StaffId { get; set; }
    
    [Required]
    public string Role { get; set; } = string.Empty;
}

// For assigning staff to clients
public class AssignStaffToClientDto
{
    [Required]
    public Guid StaffId { get; set; }
    
    public bool IsPrimary { get; set; } = false;
}

// Staff performance/workload summary
public class StaffPerformanceDto
{
    public Guid Id { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string? Title { get; set; }
    public string? Office { get; set; }
    
    public int ActiveCampaigns { get; set; }
    public int CompletedCampaigns { get; set; }
    public int ClientContacts { get; set; }
    public int ConceptNotes { get; set; }
    public int CompletedAdverts { get; set; }
    
    // Workload indicator (0-100)
    public int WorkloadScore { get; set; }
}

