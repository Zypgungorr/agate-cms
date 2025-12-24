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
            .OrderBy(c => c.StartDate)
            .Select(c => new CampaignListDto
            {
                Id = c.Id,
                ClientName = c.Client.Name,
                Title = c.Title,
                Status = c.Status,
                StartDate = c.StartDate,
                EndDate = c.EndDate,
                EstimatedBudget = c.EstimatedBudget,
                // ActualCost'u sadece "Actual" tipindeki budget_lines'dan hesapla
                ActualCost = _context.BudgetLines
                    .Where(bl => bl.CampaignId == c.Id && bl.Type == "Actual")
                    .Sum(bl => (decimal?)bl.Amount) ?? 0,
                TotalAdverts = c.Adverts.Count,
                CompletedAdverts = c.Adverts.Count(a => a.Status == AdvertStatusValues.Completed),
                ActiveAdverts = c.Adverts.Count(a => a.Status == AdvertStatusValues.InProgress || a.Status == AdvertStatusValues.Scheduled),
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

        // ActualCost'u sadece "Actual" tipindeki budget_lines'dan hesapla
        var actualCost = await _context.BudgetLines
            .Where(bl => bl.CampaignId == id && bl.Type == "Actual")
            .SumAsync(bl => (decimal?)bl.Amount) ?? 0;

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
            ActualCost = actualCost,
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

    // Kampanya silme işlemi - ilişkili tüm kayıtları da siler
    // Related entities: AiAuditLogs, AiSuggestions, BudgetLines, ConceptNotes, Adverts, CampaignStaff
    public async Task<bool> DeleteCampaignAsync(Guid id)
    {
        // Transaction kullanarak tüm işlemleri güvenli şekilde yap
        using var transaction = await _context.Database.BeginTransactionAsync();
        
        try
        {
            // Kampanya var mı kontrol et
            var campaignExists = await _context.Campaigns.AnyAsync(c => c.Id == id);
            if (!campaignExists)
            {
                await transaction.RollbackAsync();
                return false;
            }

            Console.WriteLine($"Starting deletion of campaign {id}");

            // İlişkili kayıtları manuel olarak sil - doğru sırada
            
            // 1. AI Audit Logs'ları sil (başka tabloya bağlı değil)
            var aiAuditLogsCount = await _context.Database
                .ExecuteSqlRawAsync("DELETE FROM ai_audit_logs WHERE campaign_id = {0}", id);
            Console.WriteLine($"Deleted {aiAuditLogsCount} AI audit logs");
            
            // 2. AI Suggestions'ları sil (başka tabloya bağlı değil)
            var aiSuggestionsCount = await _context.Database
                .ExecuteSqlRawAsync("DELETE FROM ai_suggestions WHERE campaign_id = {0}", id);
            Console.WriteLine($"Deleted {aiSuggestionsCount} AI suggestions");
            
            // 3. Budget line'ları sil (hem campaign hem advert'e bağlı olabilir)
            var budgetLinesCount = await _context.Database
                .ExecuteSqlRawAsync("DELETE FROM budget_lines WHERE campaign_id = {0}", id);
            Console.WriteLine($"Deleted {budgetLinesCount} budget lines");
            
            // 4. Concept note'ları sil
            var conceptNotesCount = await _context.Database
                .ExecuteSqlRawAsync("DELETE FROM concept_notes WHERE campaign_id = {0}", id);
            Console.WriteLine($"Deleted {conceptNotesCount} concept notes");
            
            // 5. Advert'leri sil (önce bağlı budget_lines'lar silinmeli - yukarda silindi)
            var advertsCount = await _context.Database
                .ExecuteSqlRawAsync("DELETE FROM adverts WHERE campaign_id = {0}", id);
            Console.WriteLine($"Deleted {advertsCount} adverts");
            
            // 6. Campaign staff atamaları sil
            var campaignStaffCount = await _context.Database
                .ExecuteSqlRawAsync("DELETE FROM campaign_staff WHERE campaign_id = {0}", id);
            Console.WriteLine($"Deleted {campaignStaffCount} campaign staff assignments");
            
            // 7. Son olarak kampanyayı sil
            var campaignCount = await _context.Database
                .ExecuteSqlRawAsync("DELETE FROM campaigns WHERE id = {0}", id);
            Console.WriteLine($"Deleted campaign {id}");
            
            // Transaction'ı commit et
            await transaction.CommitAsync();
            
            Console.WriteLine($"Successfully deleted campaign {id} with all related records");
            return true;
        }
        catch (Exception ex)
        {
            // Hata durumunda rollback yap
            await transaction.RollbackAsync();
            
            Console.WriteLine($"Error in DeleteCampaignAsync: {ex.Message}");
            Console.WriteLine($"Inner exception: {ex.InnerException?.Message}");
            Console.WriteLine($"Stack trace: {ex.StackTrace}");
            throw;
        }
    }

    public async Task<IEnumerable<CampaignListDto>> GetCampaignsByClientAsync(Guid clientId)
    {
        return await GetCampaignsAsync(clientId: clientId);
    }
}
