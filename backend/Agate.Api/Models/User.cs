using System.ComponentModel.DataAnnotations;

namespace Agate.Api.Models;

public class User
{
    public Guid Id { get; set; } = Guid.NewGuid();
    
    [Required]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;
    
    [Required]
    public string PasswordHash { get; set; } = string.Empty;
    
    [Required]
    public string FullName { get; set; } = string.Empty;
    
    public string? Title { get; set; }
    public string? Office { get; set; } // Office location for reporting
    
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    
    // Navigation properties
    public ICollection<UserRole> UserRoles { get; set; } = new List<UserRole>();
    public ICollection<CampaignStaff> CampaignAssignments { get; set; } = new List<CampaignStaff>();
    public ICollection<ClientStaffContact> ClientStaffContacts { get; set; } = new List<ClientStaffContact>();
    public ICollection<ConceptNote> ConceptNotes { get; set; } = new List<ConceptNote>();
    public ICollection<Campaign> CreatedCampaigns { get; set; } = new List<Campaign>();
    public ICollection<Advert> OwnedAdverts { get; set; } = new List<Advert>();
}

public class Role
{
    public int Id { get; set; }
    
    [Required]
    public string Key { get; set; } = string.Empty;
    
    [Required]
    public string Name { get; set; } = string.Empty;
    
    // Navigation properties
    public ICollection<UserRole> UserRoles { get; set; } = new List<UserRole>();
}

public class UserRole
{
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;
    
    public int RoleId { get; set; }
    public Role Role { get; set; } = null!;
}

public static class RoleKeys
{
    public const string Admin = "admin";
    public const string AccountManager = "account_manager";
    public const string Creative = "creative";
    public const string Analyst = "analyst";
}
