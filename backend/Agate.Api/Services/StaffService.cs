using Microsoft.EntityFrameworkCore;
using Agate.Api.Data;
using Agate.Api.DTOs;
using Agate.Api.Models;

namespace Agate.Api.Services;

public class StaffService : IStaffService
{
    private readonly AgateDbContext _context;

    public StaffService(AgateDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<StaffListDto>> GetStaffListAsync(bool includeInactive = false)
    {
        var query = _context.Users
            .Include(u => u.UserRoles)
                .ThenInclude(ur => ur.Role)
            .Include(u => u.CampaignAssignments)
                .ThenInclude(ca => ca.Campaign)
            .Include(u => u.ClientStaffContacts)
            .AsQueryable();

        if (!includeInactive)
        {
            query = query.Where(u => u.IsActive);
        }

        var staff = await query
            .OrderBy(u => u.FullName)
            .Select(u => new StaffListDto
            {
                Id = u.Id,
                FullName = u.FullName,
                Email = u.Email,
                Title = u.Title,
                Office = u.Office,
                IsActive = u.IsActive,
                Roles = u.UserRoles.Select(ur => ur.Role.Key).ToList(),
                ActiveCampaigns = u.CampaignAssignments.Count(ca => 
                    ca.Campaign.Status == CampaignStatusValues.Active || 
                    ca.Campaign.Status == CampaignStatusValues.Planned),
                TotalCampaigns = u.CampaignAssignments.Count,
                ClientContacts = u.ClientStaffContacts.Count
            })
            .ToListAsync();

        return staff;
    }

    public async Task<StaffDto?> GetStaffByIdAsync(Guid id)
    {
        var user = await _context.Users
            .Include(u => u.UserRoles)
                .ThenInclude(ur => ur.Role)
            .Include(u => u.CampaignAssignments)
                .ThenInclude(ca => ca.Campaign)
                    .ThenInclude(c => c.Client)
            .Include(u => u.ClientStaffContacts)
                .ThenInclude(csc => csc.Client)
            .Include(u => u.ConceptNotes)
            .Include(u => u.OwnedAdverts)
            .FirstOrDefaultAsync(u => u.Id == id);

        if (user == null) return null;

        return new StaffDto
        {
            Id = user.Id,
            FullName = user.FullName,
            Email = user.Email,
            Title = user.Title,
            Office = user.Office,
            IsActive = user.IsActive,
            CreatedAt = user.CreatedAt,
            UpdatedAt = user.UpdatedAt,
            Roles = user.UserRoles.Select(ur => ur.Role.Key).ToList(),
            ActiveCampaigns = user.CampaignAssignments.Count(ca => 
                ca.Campaign.Status == CampaignStatusValues.Active),
            CompletedCampaigns = user.CampaignAssignments.Count(ca => 
                ca.Campaign.Status == CampaignStatusValues.Completed),
            TotalCampaigns = user.CampaignAssignments.Count,
            ClientContacts = user.ClientStaffContacts.Count,
            PrimaryClientContacts = user.ClientStaffContacts.Count(csc => csc.IsPrimary),
            ConceptNotes = user.ConceptNotes.Count,
            OwnedAdverts = user.OwnedAdverts.Count,
            CampaignAssignments = user.CampaignAssignments
                .OrderByDescending(ca => ca.AssignedAt)
                .Select(ca => new CampaignAssignmentDto
                {
                    CampaignId = ca.CampaignId,
                    CampaignTitle = ca.Campaign.Title,
                    CampaignStatus = ca.Campaign.Status,
                    ClientName = ca.Campaign.Client.Name,
                    Role = ca.Role,
                    AssignedAt = ca.AssignedAt
                })
                .ToList(),
            ClientAssignments = user.ClientStaffContacts
                .OrderByDescending(csc => csc.IsPrimary)
                .ThenBy(csc => csc.Client.Name)
                .Select(csc => new ClientContactDto
                {
                    ClientId = csc.ClientId,
                    ClientName = csc.Client.Name,
                    IsPrimary = csc.IsPrimary,
                    AssignedAt = csc.CreatedAt
                })
                .ToList()
        };
    }

    public async Task<StaffDto> CreateStaffAsync(CreateStaffDto createDto)
    {
        // Check if email already exists
        var existingUser = await _context.Users.FirstOrDefaultAsync(u => u.Email == createDto.Email);
        if (existingUser != null)
        {
            throw new ArgumentException("A user with this email already exists");
        }

        // Hash password
        var passwordHash = BCrypt.Net.BCrypt.HashPassword(createDto.Password);

        var user = new User
        {
            Id = Guid.NewGuid(),
            Email = createDto.Email,
            PasswordHash = passwordHash,
            FullName = createDto.FullName,
            Title = createDto.Title,
            Office = createDto.Office,
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Users.Add(user);

        // Assign roles
        foreach (var roleKey in createDto.Roles)
        {
            var role = await _context.Roles.FirstOrDefaultAsync(r => r.Key == roleKey);
            if (role != null)
            {
                _context.UserRoles.Add(new UserRole
                {
                    UserId = user.Id,
                    RoleId = role.Id
                });
            }
        }

        await _context.SaveChangesAsync();

        return await GetStaffByIdAsync(user.Id) 
            ?? throw new InvalidOperationException("Failed to retrieve created staff");
    }

    public async Task<StaffDto?> UpdateStaffAsync(Guid id, UpdateStaffDto updateDto)
    {
        var user = await _context.Users
            .Include(u => u.UserRoles)
            .FirstOrDefaultAsync(u => u.Id == id);

        if (user == null) return null;

        user.FullName = updateDto.FullName;
        user.Title = updateDto.Title;
        user.Office = updateDto.Office;
        user.IsActive = updateDto.IsActive;
        user.UpdatedAt = DateTime.UtcNow;

        // Update roles
        _context.UserRoles.RemoveRange(user.UserRoles);
        
        foreach (var roleKey in updateDto.Roles)
        {
            var role = await _context.Roles.FirstOrDefaultAsync(r => r.Key == roleKey);
            if (role != null)
            {
                _context.UserRoles.Add(new UserRole
                {
                    UserId = user.Id,
                    RoleId = role.Id
                });
            }
        }

        await _context.SaveChangesAsync();

        return await GetStaffByIdAsync(id);
    }

    public async Task<bool> ChangeStaffPasswordAsync(Guid id, ChangeStaffPasswordDto passwordDto)
    {
        var user = await _context.Users.FindAsync(id);
        if (user == null) return false;

        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(passwordDto.NewPassword);
        user.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> DeleteStaffAsync(Guid id)
    {
        var user = await _context.Users.FindAsync(id);
        if (user == null) return false;

        // Check if staff has campaign assignments
        var hasCampaigns = await _context.CampaignStaff.AnyAsync(cs => cs.StaffId == id);
        if (hasCampaigns)
        {
            throw new InvalidOperationException(
                "Cannot delete staff member with campaign assignments. Remove assignments first or set as inactive.");
        }

        // Check if staff has client contacts
        var hasClientContacts = await _context.ClientStaffContacts.AnyAsync(csc => csc.StaffId == id);
        if (hasClientContacts)
        {
            throw new InvalidOperationException(
                "Cannot delete staff member with client contacts. Remove contacts first or set as inactive.");
        }

        _context.Users.Remove(user);
        await _context.SaveChangesAsync();
        return true;
    }

    // Campaign assignments
    public async Task<IEnumerable<CampaignAssignmentDto>> GetStaffCampaignAssignmentsAsync(Guid staffId)
    {
        var assignments = await _context.CampaignStaff
            .Include(cs => cs.Campaign)
                .ThenInclude(c => c.Client)
            .Where(cs => cs.StaffId == staffId)
            .OrderByDescending(cs => cs.AssignedAt)
            .Select(cs => new CampaignAssignmentDto
            {
                CampaignId = cs.CampaignId,
                CampaignTitle = cs.Campaign.Title,
                CampaignStatus = cs.Campaign.Status,
                ClientName = cs.Campaign.Client.Name,
                Role = cs.Role,
                AssignedAt = cs.AssignedAt
            })
            .ToListAsync();

        return assignments;
    }

    public async Task<bool> AssignStaffToCampaignAsync(Guid campaignId, AssignStaffToCampaignDto assignDto)
    {
        // Check if campaign exists
        var campaignExists = await _context.Campaigns.AnyAsync(c => c.Id == campaignId);
        if (!campaignExists)
        {
            throw new ArgumentException("Campaign not found");
        }

        // Check if staff exists
        var staffExists = await _context.Users.AnyAsync(u => u.Id == assignDto.StaffId && u.IsActive);
        if (!staffExists)
        {
            throw new ArgumentException("Staff member not found or inactive");
        }

        // Check if already assigned
        var existingAssignment = await _context.CampaignStaff
            .FirstOrDefaultAsync(cs => cs.CampaignId == campaignId && cs.StaffId == assignDto.StaffId);

        if (existingAssignment != null)
        {
            // Update role if already assigned
            existingAssignment.Role = assignDto.Role;
        }
        else
        {
            // Create new assignment
            _context.CampaignStaff.Add(new CampaignStaff
            {
                CampaignId = campaignId,
                StaffId = assignDto.StaffId,
                Role = assignDto.Role,
                AssignedAt = DateTime.UtcNow
            });
        }

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> RemoveStaffFromCampaignAsync(Guid campaignId, Guid staffId)
    {
        var assignment = await _context.CampaignStaff
            .FirstOrDefaultAsync(cs => cs.CampaignId == campaignId && cs.StaffId == staffId);

        if (assignment == null) return false;

        _context.CampaignStaff.Remove(assignment);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<IEnumerable<StaffListDto>> GetCampaignStaffAsync(Guid campaignId)
    {
        var staff = await _context.CampaignStaff
            .Include(cs => cs.Staff)
                .ThenInclude(s => s.UserRoles)
                    .ThenInclude(ur => ur.Role)
            .Where(cs => cs.CampaignId == campaignId)
            .Select(cs => new StaffListDto
            {
                Id = cs.Staff.Id,
                FullName = cs.Staff.FullName,
                Email = cs.Staff.Email,
                Title = cs.Staff.Title,
                Office = cs.Staff.Office,
                IsActive = cs.Staff.IsActive,
                Roles = cs.Staff.UserRoles.Select(ur => ur.Role.Key).ToList()
            })
            .ToListAsync();

        return staff;
    }

    // Client assignments
    public async Task<IEnumerable<ClientContactDto>> GetStaffClientContactsAsync(Guid staffId)
    {
        var contacts = await _context.ClientStaffContacts
            .Include(csc => csc.Client)
            .Where(csc => csc.StaffId == staffId)
            .OrderByDescending(csc => csc.IsPrimary)
            .ThenBy(csc => csc.Client.Name)
            .Select(csc => new ClientContactDto
            {
                ClientId = csc.ClientId,
                ClientName = csc.Client.Name,
                IsPrimary = csc.IsPrimary,
                AssignedAt = csc.CreatedAt
            })
            .ToListAsync();

        return contacts;
    }

    public async Task<bool> AssignStaffToClientAsync(Guid clientId, AssignStaffToClientDto assignDto)
    {
        // Check if client exists
        var clientExists = await _context.Clients.AnyAsync(c => c.Id == clientId);
        if (!clientExists)
        {
            throw new ArgumentException("Client not found");
        }

        // Check if staff exists
        var staffExists = await _context.Users.AnyAsync(u => u.Id == assignDto.StaffId && u.IsActive);
        if (!staffExists)
        {
            throw new ArgumentException("Staff member not found or inactive");
        }

        // Check if already assigned
        var existingContact = await _context.ClientStaffContacts
            .FirstOrDefaultAsync(csc => csc.ClientId == clientId && csc.StaffId == assignDto.StaffId);

        if (existingContact != null)
        {
            // Update primary status if already assigned
            existingContact.IsPrimary = assignDto.IsPrimary;
        }
        else
        {
            // Create new contact
            _context.ClientStaffContacts.Add(new ClientStaffContact
            {
                ClientId = clientId,
                StaffId = assignDto.StaffId,
                IsPrimary = assignDto.IsPrimary,
                CreatedAt = DateTime.UtcNow
            });
        }

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> RemoveStaffFromClientAsync(Guid clientId, Guid staffId)
    {
        var contact = await _context.ClientStaffContacts
            .FirstOrDefaultAsync(csc => csc.ClientId == clientId && csc.StaffId == staffId);

        if (contact == null) return false;

        _context.ClientStaffContacts.Remove(contact);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<IEnumerable<StaffListDto>> GetClientStaffContactsAsync(Guid clientId)
    {
        var staff = await _context.ClientStaffContacts
            .Include(csc => csc.Staff)
                .ThenInclude(s => s.UserRoles)
                    .ThenInclude(ur => ur.Role)
            .Where(csc => csc.ClientId == clientId)
            .OrderByDescending(csc => csc.IsPrimary)
            .Select(csc => new StaffListDto
            {
                Id = csc.Staff.Id,
                FullName = csc.Staff.FullName,
                Email = csc.Staff.Email,
                Title = csc.Staff.Title,
                Office = csc.Staff.Office,
                IsActive = csc.Staff.IsActive,
                Roles = csc.Staff.UserRoles.Select(ur => ur.Role.Key).ToList()
            })
            .ToListAsync();

        return staff;
    }

    // Performance & workload
    public async Task<IEnumerable<StaffPerformanceDto>> GetStaffPerformanceAsync()
    {
        var staff = await _context.Users
            .Include(u => u.CampaignAssignments)
                .ThenInclude(ca => ca.Campaign)
            .Include(u => u.ClientStaffContacts)
            .Include(u => u.ConceptNotes)
            .Include(u => u.OwnedAdverts)
            .Where(u => u.IsActive)
            .Select(u => new StaffPerformanceDto
            {
                Id = u.Id,
                FullName = u.FullName,
                Title = u.Title,
                Office = u.Office,
                ActiveCampaigns = u.CampaignAssignments.Count(ca => 
                    ca.Campaign.Status == CampaignStatusValues.Active),
                CompletedCampaigns = u.CampaignAssignments.Count(ca => 
                    ca.Campaign.Status == CampaignStatusValues.Completed),
                ClientContacts = u.ClientStaffContacts.Count,
                ConceptNotes = u.ConceptNotes.Count,
                CompletedAdverts = u.OwnedAdverts.Count(a => a.Status == AdvertStatusValues.Completed),
                // Simple workload score based on active campaigns
                WorkloadScore = u.CampaignAssignments.Count(ca => 
                    ca.Campaign.Status == CampaignStatusValues.Active) * 20
            })
            .OrderByDescending(s => s.ActiveCampaigns)
            .ToListAsync();

        return staff;
    }
}

