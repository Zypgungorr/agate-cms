using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using Agate.Api.Services;
using Agate.Api.Dtos;

namespace Agate.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class BudgetController : ControllerBase
{
    private readonly IBudgetService _budgetService;

    public BudgetController(IBudgetService budgetService)
    {
        _budgetService = budgetService;
    }

    /// <summary>
    /// Get all budget lines with optional filtering
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<IEnumerable<BudgetLineDto>>> GetBudgetLines(
        [FromQuery] Guid? campaignId = null,
        [FromQuery] string? category = null)
    {
        try
        {
            var budgetLines = await _budgetService.GetBudgetLinesAsync(campaignId, category);
            return Ok(budgetLines);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = ex.Message });
        }
    }

    /// <summary>
    /// Get specific budget line by ID
    /// </summary>
    [HttpGet("{id}")]
    public async Task<ActionResult<BudgetLineDto>> GetBudgetLine(long id)
    {
        try
        {
            var budgetLine = await _budgetService.GetBudgetLineByIdAsync(id);
            
            if (budgetLine == null)
            {
                return NotFound(new { error = "Budget line not found" });
            }

            return Ok(budgetLine);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = ex.Message });
        }
    }

    /// <summary>
    /// Get all budget lines for a specific campaign
    /// </summary>
    [HttpGet("campaign/{campaignId}")]
    public async Task<ActionResult<IEnumerable<BudgetLineDto>>> GetBudgetLinesByCampaign(Guid campaignId)
    {
        try
        {
            var budgetLines = await _budgetService.GetBudgetLinesByCampaignAsync(campaignId);
            return Ok(budgetLines);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = ex.Message });
        }
    }

    /// <summary>
    /// Create a new budget line
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<BudgetLineDto>> CreateBudgetLine(CreateBudgetLineDto createDto)
    {
        try
        {
            var budgetLine = await _budgetService.CreateBudgetLineAsync(createDto);
            return CreatedAtAction(nameof(GetBudgetLine), new { id = budgetLine.Id }, budgetLine);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = ex.Message });
        }
    }

    /// <summary>
    /// Update an existing budget line
    /// </summary>
    [HttpPut("{id}")]
    public async Task<ActionResult<BudgetLineDto>> UpdateBudgetLine(long id, UpdateBudgetLineDto updateDto)
    {
        try
        {
            var budgetLine = await _budgetService.UpdateBudgetLineAsync(id, updateDto);
            
            if (budgetLine == null)
            {
                return NotFound(new { error = "Budget line not found" });
            }

            return Ok(budgetLine);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = ex.Message });
        }
    }

    /// <summary>
    /// Delete a budget line
    /// </summary>
    [HttpDelete("{id}")]
    public async Task<ActionResult> DeleteBudgetLine(long id)
    {
        try
        {
            var deleted = await _budgetService.DeleteBudgetLineAsync(id);
            
            if (!deleted)
            {
                return NotFound(new { error = "Budget line not found" });
            }

            return NoContent();
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = ex.Message });
        }
    }

    /// <summary>
    /// Get budget summary for a campaign
    /// </summary>
    [HttpGet("summary/{campaignId}")]
    public async Task<ActionResult<BudgetSummaryDto>> GetBudgetSummary(Guid campaignId)
    {
        try
        {
            var summary = await _budgetService.GetBudgetSummaryAsync(campaignId);
            
            if (summary == null)
            {
                return NotFound(new { error = "Campaign not found" });
            }

            return Ok(summary);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = ex.Message });
        }
    }

    /// <summary>
    /// Get budget analytics for a campaign
    /// </summary>
    [HttpGet("analytics/{campaignId}")]
    public async Task<ActionResult<BudgetAnalyticsDto>> GetBudgetAnalytics(Guid campaignId)
    {
        try
        {
            var analytics = await _budgetService.GetBudgetAnalyticsAsync(campaignId);
            
            if (analytics == null)
            {
                return NotFound(new { error = "Campaign not found" });
            }

            return Ok(analytics);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = ex.Message });
        }
    }

    /// <summary>
    /// Get category breakdown for a campaign
    /// </summary>
    [HttpGet("categories/{campaignId}")]
    public async Task<ActionResult<IEnumerable<BudgetCategoryDto>>> GetCategoryBreakdown(Guid campaignId)
    {
        try
        {
            var categories = await _budgetService.GetCategoryBreakdownAsync(campaignId);
            return Ok(categories);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = ex.Message });
        }
    }

    /// <summary>
    /// Get budget trend for a campaign
    /// </summary>
    [HttpGet("trend/{campaignId}")]
    public async Task<ActionResult<IEnumerable<BudgetTrendDto>>> GetBudgetTrend(Guid campaignId, [FromQuery] int months = 12)
    {
        try
        {
            var trend = await _budgetService.GetBudgetTrendAsync(campaignId, months);
            return Ok(trend);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = ex.Message });
        }
    }

    /// <summary>
    /// Get available budget categories
    /// </summary>
    [HttpGet("categories")]
    public async Task<ActionResult<string[]>> GetCategories()
    {
        try
        {
            var categories = await _budgetService.GetCategoriesAsync();
            return Ok(categories);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = ex.Message });
        }
    }
}
