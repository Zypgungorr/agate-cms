using Microsoft.EntityFrameworkCore;
using Agate.Api.Data;
using Agate.Api.DTOs;
using Agate.Api.Models;

namespace Agate.Api.Services;

public class CampaignService : ICampaignService
{
    private readonly AgateDbContext _context;

    public CampaignService(AgateDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<CampaignListDto>> GetCampaignsAsync(string? status = null, Guid? clientId = null)
    {
        var query = _context.Campaigns
            .Include(c => c.Client)
            .Include(c => c.Adverts)
            .AsQueryable();

        if (!string.IsNullOrEmpty(status))
        {
            query = query.Where(c => c.Status == status);
        }

        if (clientId.HasValue)
        {
            query = query.Where(c => c.ClientId == clientId.Value);
        }

        var campaigns = await query
            .OrderByDescending(c => c.UpdatedAt)
            .Select(c => new CampaignListDto
            {
                Id = c.Id,
                ClientName = c.Client.Name,
                Title = c.Title,
                Status = c.Status,
                StartDate = c.StartDate,
                EndDate = c.EndDate,
                EstimatedBudget = c.EstimatedBudget,
                ActualCost = c.ActualCost,
                TotalAdverts = c.Adverts.Count,
                UpdatedAt = c.UpdatedAt
            })
            .ToListAsync();

        return campaigns;
    }

    public async Task<CampaignDto?> GetCampaignByIdAsync(Guid id)
    {
        var campaign = await _context.Campaigns
            .Include(c => c.Client)
            .Include(c => c.Creator)
            .Include(c => c.Adverts)
            .FirstOrDefaultAsync(c => c.Id == id);

        if (campaign == null) return null;

        return new CampaignDto
        {
            Id = campaign.Id,
            ClientId = campaign.ClientId,
            ClientName = campaign.Client.Name,
            Title = campaign.Title,
            Description = campaign.Description,
            Status = campaign.Status,
            StartDate = campaign.StartDate,
            EndDate = campaign.EndDate,
            EstimatedBudget = campaign.EstimatedBudget,
            ActualCost = campaign.ActualCost,
            CreatedByName = campaign.Creator?.FullName,
            CreatedAt = campaign.CreatedAt,
            UpdatedAt = campaign.UpdatedAt,
            TotalAdverts = campaign.Adverts.Count,
            CompletedAdverts = campaign.Adverts.Count(a => a.Status == AdvertStatusValues.Completed),
            ActiveAdverts = campaign.Adverts.Count(a => a.Status == AdvertStatusValues.InProgress || a.Status == AdvertStatusValues.Scheduled)
        };
    }

    public async Task<CampaignDto> CreateCampaignAsync(CreateCampaignDto createDto, Guid createdById)
    {
        // Verify client exists
        var clientExists = await _context.Clients.AnyAsync(c => c.Id == createDto.ClientId);
        if (!clientExists)
        {
            throw new ArgumentException("Client not found");
        }

        var campaign = new Campaign
        {
            Id = Guid.NewGuid(),
            ClientId = createDto.ClientId,
            Title = createDto.Title,
            Description = createDto.Description,
            Status = CampaignStatusValues.Planned,
            StartDate = createDto.StartDate,
            EndDate = createDto.EndDate,
            EstimatedBudget = createDto.EstimatedBudget,
            ActualCost = 0,
            CreatedBy = createdById,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Campaigns.Add(campaign);
        await _context.SaveChangesAsync();

        return await GetCampaignByIdAsync(campaign.Id) ?? throw new InvalidOperationException("Failed to retrieve created campaign");
    }

    public async Task<CampaignDto?> UpdateCampaignAsync(Guid id, UpdateCampaignDto updateDto)
    {
        var campaign = await _context.Campaigns.FindAsync(id);
        if (campaign == null) return null;

        // Validate status
        var validStatuses = new[] { 
            CampaignStatusValues.Planned, 
            CampaignStatusValues.Active, 
            CampaignStatusValues.OnHold, 
            CampaignStatusValues.Completed, 
            CampaignStatusValues.Cancelled 
        };

        if (!validStatuses.Contains(updateDto.Status))
        {
            throw new ArgumentException($"Invalid status: {updateDto.Status}");
        }

        campaign.Title = updateDto.Title;
        campaign.Description = updateDto.Description;
        campaign.Status = updateDto.Status;
        campaign.StartDate = updateDto.StartDate;
        campaign.EndDate = updateDto.EndDate;
        campaign.EstimatedBudget = updateDto.EstimatedBudget;
        campaign.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return await GetCampaignByIdAsync(id);
    }

    public async Task<bool> DeleteCampaignAsync(Guid id)
    {
        var campaign = await _context.Campaigns.FindAsync(id);
        if (campaign == null) return false;

        _context.Campaigns.Remove(campaign);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<IEnumerable<CampaignListDto>> GetCampaignsByClientAsync(Guid clientId)
    {
        return await GetCampaignsAsync(clientId: clientId);
    }
}
