using Microsoft.EntityFrameworkCore;
using Agate.Api.Data;
using Agate.Api.Models;
using Agate.Api.Dtos;

namespace Agate.Api.Services;

public class BudgetService : IBudgetService
{
    private readonly AgateDbContext _context;

    public BudgetService(AgateDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<BudgetLineDto>> GetBudgetLinesAsync(Guid? campaignId = null, string? category = null)
    {
        var query = _context.BudgetLines
            .Include(bl => bl.Campaign)
            .Include(bl => bl.Advert)
            .AsQueryable();

        if (campaignId.HasValue)
        {
            query = query.Where(bl => bl.CampaignId == campaignId.Value);
        }

        if (!string.IsNullOrEmpty(category))
        {
            query = query.Where(bl => bl.Category == category);
        }

        return await query
            .Select(bl => new BudgetLineDto
            {
                Id = bl.Id,
                CampaignId = bl.CampaignId,
                CampaignName = bl.Campaign.Title,
                AdvertId = bl.AdvertId,
                AdvertTitle = bl.Advert != null ? bl.Advert.Title : null,
                Item = bl.Item,
                Category = bl.Category,
                Type = bl.Type,
                Amount = bl.Amount,
                PlannedAmount = bl.PlannedAmount,
                Description = bl.Description,
                Vendor = bl.Vendor,
                BookedAt = bl.BookedAt,
                CreatedAt = bl.CreatedAt,
                UpdatedAt = bl.UpdatedAt
            })
            .OrderByDescending(bl => bl.CreatedAt)
            .ToListAsync();
    }

    public async Task<BudgetLineDto?> GetBudgetLineByIdAsync(long id)
    {
        var budgetLine = await _context.BudgetLines
            .Include(bl => bl.Campaign)
            .Include(bl => bl.Advert)
            .FirstOrDefaultAsync(bl => bl.Id == id);

        if (budgetLine == null)
        {
            return null;
        }

        return new BudgetLineDto
        {
            Id = budgetLine.Id,
            CampaignId = budgetLine.CampaignId,
            CampaignName = budgetLine.Campaign.Title,
            AdvertId = budgetLine.AdvertId,
            AdvertTitle = budgetLine.Advert?.Title,
            Item = budgetLine.Item,
            Category = budgetLine.Category,
            Type = budgetLine.Type,
            Amount = budgetLine.Amount,
            PlannedAmount = budgetLine.PlannedAmount,
            Description = budgetLine.Description,
            Vendor = budgetLine.Vendor,
            BookedAt = budgetLine.BookedAt,
            CreatedAt = budgetLine.CreatedAt,
            UpdatedAt = budgetLine.UpdatedAt
        };
    }

    public async Task<IEnumerable<BudgetLineDto>> GetBudgetLinesByCampaignAsync(Guid campaignId)
    {
        return await GetBudgetLinesAsync(campaignId);
    }

    public async Task<BudgetLineDto> CreateBudgetLineAsync(CreateBudgetLineDto createDto)
    {
        // Validate campaign exists
        var campaign = await _context.Campaigns.FindAsync(createDto.CampaignId);
        if (campaign == null)
        {
            throw new ArgumentException("Campaign not found");
        }

        // Validate advert if provided
        if (createDto.AdvertId.HasValue)
        {
            var advert = await _context.Adverts.FindAsync(createDto.AdvertId.Value);
            if (advert == null)
            {
                throw new ArgumentException("Advert not found");
            }
        }

        var budgetLine = new BudgetLine
        {
            CampaignId = createDto.CampaignId,
            AdvertId = createDto.AdvertId,
            Item = createDto.Item,
            Category = createDto.Category,
            Type = createDto.Type,
            Amount = createDto.Amount,
            PlannedAmount = createDto.PlannedAmount,
            Description = createDto.Description,
            Vendor = createDto.Vendor,
            BookedAt = createDto.BookedAt,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.BudgetLines.Add(budgetLine);
        await _context.SaveChangesAsync();

        // Load related data for return
        await _context.Entry(budgetLine)
            .Reference(bl => bl.Campaign)
            .LoadAsync();

        if (budgetLine.AdvertId.HasValue)
        {
            await _context.Entry(budgetLine)
                .Reference(bl => bl.Advert)
                .LoadAsync();
        }

        return new BudgetLineDto
        {
            Id = budgetLine.Id,
            CampaignId = budgetLine.CampaignId,
            CampaignName = budgetLine.Campaign.Title,
            AdvertId = budgetLine.AdvertId,
            AdvertTitle = budgetLine.Advert?.Title,
            Item = budgetLine.Item,
            Category = budgetLine.Category,
            Type = budgetLine.Type,
            Amount = budgetLine.Amount,
            PlannedAmount = budgetLine.PlannedAmount,
            Description = budgetLine.Description,
            Vendor = budgetLine.Vendor,
            BookedAt = budgetLine.BookedAt,
            CreatedAt = budgetLine.CreatedAt,
            UpdatedAt = budgetLine.UpdatedAt
        };
    }

    public async Task<BudgetLineDto?> UpdateBudgetLineAsync(long id, UpdateBudgetLineDto updateDto)
    {
        var budgetLine = await _context.BudgetLines
            .Include(bl => bl.Campaign)
            .Include(bl => bl.Advert)
            .FirstOrDefaultAsync(bl => bl.Id == id);

        if (budgetLine == null)
        {
            return null;
        }

        // Update fields if provided
        if (!string.IsNullOrEmpty(updateDto.Item))
        {
            budgetLine.Item = updateDto.Item;
        }

        if (!string.IsNullOrEmpty(updateDto.Category))
        {
            budgetLine.Category = updateDto.Category;
        }

        if (!string.IsNullOrEmpty(updateDto.Type))
        {
            budgetLine.Type = updateDto.Type;
        }

        if (updateDto.Amount.HasValue)
        {
            budgetLine.Amount = updateDto.Amount.Value;
        }

        if (updateDto.PlannedAmount.HasValue)
        {
            budgetLine.PlannedAmount = updateDto.PlannedAmount.Value;
        }

        if (updateDto.Description != null)
        {
            budgetLine.Description = updateDto.Description;
        }

        if (updateDto.Vendor != null)
        {
            budgetLine.Vendor = updateDto.Vendor;
        }

        if (updateDto.BookedAt.HasValue)
        {
            budgetLine.BookedAt = updateDto.BookedAt.Value;
        }

        budgetLine.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return new BudgetLineDto
        {
            Id = budgetLine.Id,
            CampaignId = budgetLine.CampaignId,
            CampaignName = budgetLine.Campaign.Title,
            AdvertId = budgetLine.AdvertId,
            AdvertTitle = budgetLine.Advert?.Title,
            Item = budgetLine.Item,
            Category = budgetLine.Category,
            Type = budgetLine.Type,
            Amount = budgetLine.Amount,
            PlannedAmount = budgetLine.PlannedAmount,
            Description = budgetLine.Description,
            Vendor = budgetLine.Vendor,
            BookedAt = budgetLine.BookedAt,
            CreatedAt = budgetLine.CreatedAt,
            UpdatedAt = budgetLine.UpdatedAt
        };
    }

    public async Task<bool> DeleteBudgetLineAsync(long id)
    {
        var budgetLine = await _context.BudgetLines.FirstOrDefaultAsync(bl => bl.Id == id);

        if (budgetLine == null)
        {
            return false;
        }

        _context.BudgetLines.Remove(budgetLine);
        await _context.SaveChangesAsync();

        return true;
    }

    // Bir advert için toplam planned budget'ı getir
    public async Task<decimal> GetPlannedAmountForAdvertAsync(Guid advertId)
    {
        Console.WriteLine($"Getting planned amount for advert: {advertId}");
        
        var plannedTotal = await _context.BudgetLines
            .Where(bl => bl.AdvertId == advertId && bl.Type == "Planned")
            .SumAsync(bl => bl.Amount);

        Console.WriteLine($"Found planned amount: ${plannedTotal}");
        
        return plannedTotal;
    }

    public async Task<BudgetSummaryDto?> GetBudgetSummaryAsync(Guid campaignId)
    {
        var campaign = await _context.Campaigns.FindAsync(campaignId);
        if (campaign == null)
        {
            return null;
        }

        var budgetLines = await _context.BudgetLines
            .Include(bl => bl.Campaign)
            .Include(bl => bl.Advert)
            .Where(bl => bl.CampaignId == campaignId)
            .ToListAsync();

        var totalPlanned = budgetLines.Sum(bl => bl.PlannedAmount);
        var totalActual = budgetLines.Where(bl => bl.Type == "Actual").Sum(bl => bl.Amount);
        var variance = totalActual - totalPlanned;
        var variancePercent = totalPlanned > 0 ? (variance / totalPlanned) * 100 : 0;

        var categories = await GetCategoryBreakdownAsync(campaignId);
        
        var recentTransactions = budgetLines
            .OrderByDescending(bl => bl.CreatedAt)
            .Take(10)
            .Select(bl => new BudgetLineDto
            {
                Id = bl.Id,
                CampaignId = bl.CampaignId,
                CampaignName = bl.Campaign.Title,
                AdvertId = bl.AdvertId,
                AdvertTitle = bl.Advert?.Title,
                Item = bl.Item,
                Category = bl.Category,
                Type = bl.Type,
                Amount = bl.Amount,
                PlannedAmount = bl.PlannedAmount,
                Description = bl.Description,
                Vendor = bl.Vendor,
                BookedAt = bl.BookedAt,
                CreatedAt = bl.CreatedAt,
                UpdatedAt = bl.UpdatedAt
            })
            .ToList();

        return new BudgetSummaryDto
        {
            CampaignId = campaignId,
            CampaignName = campaign.Title,
            TotalPlanned = totalPlanned,
            TotalActual = totalActual,
            Variance = variance,
            VariancePercent = variancePercent,
            Categories = categories.ToList(),
            RecentTransactions = recentTransactions
        };
    }

    public async Task<BudgetAnalyticsDto?> GetBudgetAnalyticsAsync(Guid campaignId)
    {
        var budgetLines = await _context.BudgetLines
            .Where(bl => bl.CampaignId == campaignId)
            .ToListAsync();

        var totalBudget = budgetLines.Sum(bl => bl.PlannedAmount);
        var spentAmount = budgetLines.Where(bl => bl.Type == "Actual").Sum(bl => bl.Amount);
        var remainingAmount = totalBudget - spentAmount;
        var spentPercent = totalBudget > 0 ? (spentAmount / totalBudget) * 100 : 0;

        var categoryBreakdown = await GetCategoryBreakdownAsync(campaignId);
        var monthlyTrend = await GetBudgetTrendAsync(campaignId);

        var topVendors = budgetLines
            .Where(bl => !string.IsNullOrEmpty(bl.Vendor))
            .GroupBy(bl => bl.Vendor)
            .Select(g => new BudgetVendorDto
            {
                Vendor = g.Key!,
                TotalAmount = g.Sum(bl => bl.Amount),
                TransactionCount = g.Count()
            })
            .OrderByDescending(v => v.TotalAmount)
            .Take(10)
            .ToList();

        return new BudgetAnalyticsDto
        {
            TotalBudget = totalBudget,
            SpentAmount = spentAmount,
            RemainingAmount = remainingAmount,
            SpentPercent = spentPercent,
            MonthlyTrend = monthlyTrend.ToList(),
            CategoryBreakdown = categoryBreakdown.ToList(),
            TopVendors = topVendors
        };
    }

    public async Task<IEnumerable<BudgetCategoryDto>> GetCategoryBreakdownAsync(Guid campaignId)
    {
        var budgetLines = await _context.BudgetLines
            .Where(bl => bl.CampaignId == campaignId)
            .ToListAsync();

        return budgetLines
            .GroupBy(bl => bl.Category)
            .Select(g => new BudgetCategoryDto
            {
                Category = g.Key,
                PlannedAmount = g.Sum(bl => bl.PlannedAmount),
                ActualAmount = g.Where(bl => bl.Type == "Actual").Sum(bl => bl.Amount),
                ItemCount = g.Count(),
                Variance = g.Where(bl => bl.Type == "Actual").Sum(bl => bl.Amount) - g.Sum(bl => bl.PlannedAmount),
                VariancePercent = g.Sum(bl => bl.PlannedAmount) > 0 
                    ? ((g.Where(bl => bl.Type == "Actual").Sum(bl => bl.Amount) - g.Sum(bl => bl.PlannedAmount)) / g.Sum(bl => bl.PlannedAmount)) * 100 
                    : 0
            })
            .OrderByDescending(c => c.PlannedAmount)
            .ToList();
    }

    public async Task<IEnumerable<BudgetTrendDto>> GetBudgetTrendAsync(Guid campaignId, int months = 12)
    {
        var startDate = DateTime.UtcNow.AddMonths(-months);
        
        var budgetLines = await _context.BudgetLines
            .Where(bl => bl.CampaignId == campaignId && bl.CreatedAt >= startDate)
            .ToListAsync();

        return budgetLines
            .GroupBy(bl => new { bl.CreatedAt.Year, bl.CreatedAt.Month })
            .Select(g => new BudgetTrendDto
            {
                Month = $"{g.Key.Year}-{g.Key.Month:D2}",
                PlannedAmount = g.Sum(bl => bl.PlannedAmount),
                ActualAmount = g.Where(bl => bl.Type == "Actual").Sum(bl => bl.Amount)
            })
            .OrderBy(t => t.Month)
            .ToList();
    }

    public async Task<string[]> GetCategoriesAsync()
    {
        return new[] { "Creative", "Media", "Production", "Talent", "Technology", "Other" };
    }
}
