using Microsoft.EntityFrameworkCore;
using Agate.Api.Data;
using Agate.Api.Models;
using Agate.Api.Dtos;

namespace Agate.Api.Services;

public interface IAdvertService
{
    Task<IEnumerable<AdvertListDto>> GetAllAdvertsAsync(Guid? campaignId = null, string? status = null);
    Task<AdvertDto?> GetAdvertByIdAsync(Guid id);
    Task<AdvertDto> CreateAdvertAsync(CreateAdvertDto createDto);
    Task<AdvertDto?> UpdateAdvertAsync(Guid id, UpdateAdvertDto updateDto);
    Task<bool> DeleteAdvertAsync(Guid id);
    Task<IEnumerable<AdvertListDto>> GetAdvertsByCampaignAsync(Guid campaignId);
}

public class AdvertService : IAdvertService
{
    private readonly AgateDbContext _context;

    public AdvertService(AgateDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<AdvertListDto>> GetAllAdvertsAsync(Guid? campaignId = null, string? status = null)
    {
        var query = _context.Adverts
            .Include(a => a.Campaign)
            .Include(a => a.Owner)
            .AsQueryable();

        if (campaignId.HasValue)
        {
            query = query.Where(a => a.CampaignId == campaignId.Value);
        }

        if (!string.IsNullOrEmpty(status))
        {
            query = query.Where(a => a.Status == status);
        }

        var adverts = await query
            .OrderBy(a => a.PublishStart)
            .Select(a => new AdvertListDto
            {
                Id = a.Id,
                CampaignId = a.CampaignId,
                Title = a.Title,
                CampaignTitle = a.Campaign.Title,
                Channel = a.Channel,
                Status = a.Status,
                Cost = a.Cost,
                OwnerName = a.Owner != null ? a.Owner.FullName : null,
                PublishStart = a.PublishStart,
                UpdatedAt = a.UpdatedAt
            })
            .ToListAsync();

        return adverts;
    }

    public async Task<AdvertDto?> GetAdvertByIdAsync(Guid id)
    {
        var advert = await _context.Adverts
            .Include(a => a.Campaign)
            .Include(a => a.Owner)
            .FirstOrDefaultAsync(a => a.Id == id);

        if (advert == null) return null;

        return new AdvertDto
        {
            Id = advert.Id,
            CampaignId = advert.CampaignId,
            CampaignTitle = advert.Campaign.Title,
            Title = advert.Title,
            Channel = advert.Channel,
            Status = advert.Status,
            PublishStart = advert.PublishStart,
            PublishEnd = advert.PublishEnd,
            OwnerId = advert.OwnerId,
            OwnerName = advert.Owner?.FullName,
            Cost = advert.Cost,
            Notes = advert.Notes,
            CreatedAt = advert.CreatedAt,
            UpdatedAt = advert.UpdatedAt
        };
    }

    public async Task<AdvertDto> CreateAdvertAsync(CreateAdvertDto createDto)
    {
        // Verify campaign exists
        var campaignExists = await _context.Campaigns.AnyAsync(c => c.Id == createDto.CampaignId);
        if (!campaignExists)
        {
            throw new ArgumentException("Campaign not found", nameof(createDto.CampaignId));
        }

        // Verify owner exists if provided
        if (createDto.OwnerId.HasValue)
        {
            var ownerExists = await _context.Users.AnyAsync(u => u.Id == createDto.OwnerId.Value);
            if (!ownerExists)
            {
                throw new ArgumentException("Owner not found", nameof(createDto.OwnerId));
            }
        }

        var advert = new Advert
        {
            CampaignId = createDto.CampaignId,
            Title = createDto.Title,
            Channel = createDto.Channel,
            Status = createDto.Status,
            PublishStart = createDto.PublishStart,
            PublishEnd = createDto.PublishEnd,
            OwnerId = createDto.OwnerId,
            Cost = createDto.Cost,
            Notes = createDto.Notes,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Adverts.Add(advert);
        await _context.SaveChangesAsync();

        // Return created advert with related data
        return await GetAdvertByIdAsync(advert.Id) 
            ?? throw new InvalidOperationException("Failed to create advert");
    }

    public async Task<AdvertDto?> UpdateAdvertAsync(Guid id, UpdateAdvertDto updateDto)
    {
        var advert = await _context.Adverts.FindAsync(id);
        if (advert == null) return null;

        // Verify owner exists if provided
        if (updateDto.OwnerId.HasValue)
        {
            var ownerExists = await _context.Users.AnyAsync(u => u.Id == updateDto.OwnerId.Value);
            if (!ownerExists)
            {
                throw new ArgumentException("Owner not found", nameof(updateDto.OwnerId));
            }
        }

        advert.Title = updateDto.Title;
        advert.Channel = updateDto.Channel;
        advert.Status = updateDto.Status;
        advert.PublishStart = updateDto.PublishStart;
        advert.PublishEnd = updateDto.PublishEnd;
        advert.OwnerId = updateDto.OwnerId;
        advert.Cost = updateDto.Cost;
        advert.Notes = updateDto.Notes;
        advert.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return await GetAdvertByIdAsync(id);
    }

    // Advert silme işlemi - ilişkili budget line'ları da siler
    public async Task<bool> DeleteAdvertAsync(Guid id)
    {
        // Transaction kullanarak güvenli silme
        using var transaction = await _context.Database.BeginTransactionAsync();
        
        try
        {
            // Advert var mı kontrol et
            var advertExists = await _context.Adverts.AnyAsync(a => a.Id == id);
            if (!advertExists)
            {
                await transaction.RollbackAsync();
                return false;
            }

            // 1. İlişkili budget line'ları sil
            var budgetLinesCount = await _context.Database
                .ExecuteSqlRawAsync("DELETE FROM budget_lines WHERE advert_id = {0}", id);
            Console.WriteLine($"Deleted {budgetLinesCount} budget lines for advert {id}");

            // 2. Advert'i sil
            var advertCount = await _context.Database
                .ExecuteSqlRawAsync("DELETE FROM adverts WHERE id = {0}", id);
            Console.WriteLine($"Deleted advert {id}");

            // Transaction'ı commit et
            await transaction.CommitAsync();
            
            return true;
        }
        catch (Exception ex)
        {
            // Hata durumunda rollback yap
            await transaction.RollbackAsync();
            
            Console.WriteLine($"Error in DeleteAdvertAsync: {ex.Message}");
            Console.WriteLine($"Inner exception: {ex.InnerException?.Message}");
            throw;
        }
    }

    public async Task<IEnumerable<AdvertListDto>> GetAdvertsByCampaignAsync(Guid campaignId)
    {
        return await GetAllAdvertsAsync(campaignId: campaignId);
    }
}
