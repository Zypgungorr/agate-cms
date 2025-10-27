using System.ComponentModel.DataAnnotations;

namespace Agate.Api.Models;

public class Client
{
    public Guid Id { get; set; } = Guid.NewGuid();
    
    [Required]
    public string Name { get; set; } = string.Empty;
    
    public string? Address { get; set; }
    public string? ContactEmail { get; set; }
    public string? ContactPhone { get; set; }
    public string? Notes { get; set; }
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    
    // Navigation properties
    public ICollection<Campaign> Campaigns { get; set; } = new List<Campaign>();
    public ICollection<ClientStaffContact> ClientStaffContacts { get; set; } = new List<ClientStaffContact>();
}

public class ClientStaffContact
{
    public Guid ClientId { get; set; }
    public Client Client { get; set; } = null!;
    
    public Guid StaffId { get; set; }
    public User Staff { get; set; } = null!;
    
    public bool IsPrimary { get; set; } = false;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
