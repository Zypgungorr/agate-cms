using Agate.Api.Models;
using Agate.Api.Dtos;

namespace Agate.Api.Services;

public interface IBudgetService
{
    // Budget Line CRUD
    Task<IEnumerable<BudgetLineDto>> GetBudgetLinesAsync(Guid? campaignId = null, string? category = null);
    Task<BudgetLineDto?> GetBudgetLineByIdAsync(long id);
    Task<IEnumerable<BudgetLineDto>> GetBudgetLinesByCampaignAsync(Guid campaignId);
    Task<BudgetLineDto> CreateBudgetLineAsync(CreateBudgetLineDto createDto);
    Task<BudgetLineDto?> UpdateBudgetLineAsync(long id, UpdateBudgetLineDto updateDto);
    Task<bool> DeleteBudgetLineAsync(long id);

    // Budget Analysis
    Task<BudgetSummaryDto?> GetBudgetSummaryAsync(Guid campaignId);
    Task<BudgetAnalyticsDto?> GetBudgetAnalyticsAsync(Guid campaignId);
    Task<IEnumerable<BudgetCategoryDto>> GetCategoryBreakdownAsync(Guid campaignId);
    Task<IEnumerable<BudgetTrendDto>> GetBudgetTrendAsync(Guid campaignId, int months = 12);

    // Utility
    Task<string[]> GetCategoriesAsync();
}
