using System.ComponentModel.DataAnnotations;

namespace Agate.Api.DTOs;

public class CreateClientDto
{
    [Required]
    [MaxLength(200)]
    public string Name { get; set; } = string.Empty;
    
    public string? Address { get; set; }
    
    [EmailAddress]
    public string? ContactEmail { get; set; }
    
    public string? ContactPhone { get; set; }
    public string? Notes { get; set; }
}

public class UpdateClientDto
{
    [Required]
    [MaxLength(200)]
    public string Name { get; set; } = string.Empty;
    
    public string? Address { get; set; }
    
    [EmailAddress]
    public string? ContactEmail { get; set; }
    
    public string? ContactPhone { get; set; }
    public string? Notes { get; set; }
}

public class ClientDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Address { get; set; }
    public string? ContactEmail { get; set; }
    public string? ContactPhone { get; set; }
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    
    // Client statistics
    public int TotalCampaigns { get; set; }
    public int ActiveCampaigns { get; set; }
    public decimal TotalSpent { get; set; }
}

public class ClientListDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? ContactEmail { get; set; }
    public string? ContactPhone { get; set; }
    public int TotalCampaigns { get; set; }
    public int ActiveCampaigns { get; set; }
    public DateTime UpdatedAt { get; set; }
}
