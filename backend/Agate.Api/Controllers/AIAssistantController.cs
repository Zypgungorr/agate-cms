using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using System.Diagnostics;
using Agate.Api.Services;
using Agate.Api.DTOs;
using Agate.Api.Data;
using Agate.Api.Models;

namespace Agate.Api.Controllers;

[ApiController]
[Route("api/ai")]
[Authorize]
public class AIAssistantController : ControllerBase
{
    private readonly IAiService _aiService;
    private readonly IPdfService _pdfService;
    private readonly ICampaignService _campaignService;
    private readonly AgateDbContext _context;
    private readonly ILogger<AIAssistantController> _logger;

    public AIAssistantController(
        IAiService aiService, 
        IPdfService pdfService,
        ICampaignService campaignService,
        AgateDbContext context,
        ILogger<AIAssistantController> logger)
    {
        _aiService = aiService;
        _pdfService = pdfService;
        _campaignService = campaignService;
        _context = context;
        _logger = logger;
    }

    private async Task LogAiRequestAsync(string route, Guid? campaignId, int latencyMs, int statusCode)
    {
        try
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            Guid? userId = null;
            if (userIdClaim != null && Guid.TryParse(userIdClaim, out var parsedUserId))
            {
                userId = parsedUserId;
            }

            var auditLog = new AiAuditLog
            {
                UserId = userId,
                Route = route,
                CampaignId = campaignId,
                LatencyMs = latencyMs,
                StatusCode = statusCode,
                CreatedAt = DateTime.UtcNow
            };

            _context.AiAuditLogs.Add(auditLog);
            await _context.SaveChangesAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to log AI request audit");
        }
    }

    /// <summary>
    /// Campaign Manager için kampanya performans analizi ve fikir önerisi
    /// </summary>
    [HttpPost("campaign-suggestion")]
    public async Task<ActionResult<CampaignSuggestionResponseDto>> GetCampaignSuggestion(
        [FromBody] CampaignSuggestionRequestDto request)
    {
        var stopwatch = Stopwatch.StartNew();
        int statusCode = 200;
        
        if (!ModelState.IsValid)
        {
            statusCode = 400;
            await LogAiRequestAsync("/ai/campaign-suggestion", request.CampaignId, (int)stopwatch.ElapsedMilliseconds, statusCode);
            return BadRequest(ModelState);
        }

        try
        {
            // Get user ID from token
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            Guid? userId = null;
            if (userIdClaim != null && Guid.TryParse(userIdClaim, out var parsedUserId))
            {
                userId = parsedUserId;
            }

            var response = await _aiService.GetCampaignSuggestionAsync(request);
            
            // Save to database with user context
            try
            {
                var promptSnapshot = new
                {
                    campaignId = request.CampaignId,
                    analysisType = request.AnalysisType ?? "performance",
                    additionalContext = request.AdditionalContext,
                    timestamp = DateTime.UtcNow
                };

                await _aiService.SaveAiSuggestionAsync(
                    request.CampaignId,
                    userId,
                    $"campaign_suggestion_{request.AnalysisType ?? "performance"}",
                    promptSnapshot,
                    response
                );
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error saving campaign suggestion to database: {Error}", ex.Message);
                // Don't fail the request if saving fails
            }

            stopwatch.Stop();
            await LogAiRequestAsync("/ai/campaign-suggestion", request.CampaignId, (int)stopwatch.ElapsedMilliseconds, statusCode);
            
            return Ok(response);
        }
        catch (ArgumentException ex)
        {
            statusCode = 400;
            stopwatch.Stop();
            await LogAiRequestAsync("/ai/campaign-suggestion", request.CampaignId, (int)stopwatch.ElapsedMilliseconds, statusCode);
            return BadRequest(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            statusCode = 500;
            stopwatch.Stop();
            await LogAiRequestAsync("/ai/campaign-suggestion", request.CampaignId, (int)stopwatch.ElapsedMilliseconds, statusCode);
            _logger.LogError(ex, "Invalid operation error generating campaign suggestion");
            return StatusCode(500, new { message = ex.Message });
        }
        catch (Exception ex)
        {
            statusCode = 500;
            stopwatch.Stop();
            await LogAiRequestAsync("/ai/campaign-suggestion", request.CampaignId, (int)stopwatch.ElapsedMilliseconds, statusCode);
            _logger.LogError(ex, "Error generating campaign suggestion: {Error}", ex.ToString());
            return StatusCode(500, new { message = $"An error occurred while generating campaign suggestion: {ex.Message}" });
        }
    }

    /// <summary>
    /// Creative Staff için yaratıcı fikir destek endpoint'i
    /// </summary>
    [HttpPost("creative-idea")]
    public async Task<ActionResult<CreativeIdeaResponseDto>> GetCreativeIdea(
        [FromBody] CreativeIdeaRequestDto request)
    {
        var stopwatch = Stopwatch.StartNew();
        int statusCode = 200;
        
        if (!ModelState.IsValid)
        {
            statusCode = 400;
            await LogAiRequestAsync("/ai/creative-idea", request.CampaignId, (int)stopwatch.ElapsedMilliseconds, statusCode);
            return BadRequest(ModelState);
        }

        try
        {
            // Get user ID from token
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            Guid? userId = null;
            if (userIdClaim != null && Guid.TryParse(userIdClaim, out var parsedUserId))
            {
                userId = parsedUserId;
            }

            var response = await _aiService.GetCreativeIdeaAsync(request);
            
            // Save to database with user context
            try
            {
                var promptSnapshot = new
                {
                    campaignId = request.CampaignId,
                    conceptNoteId = request.ConceptNoteId,
                    requestType = request.RequestType,
                    brief = request.Brief,
                    targetAudience = request.TargetAudience,
                    tone = request.Tone,
                    timestamp = DateTime.UtcNow
                };

                await _aiService.SaveAiSuggestionAsync(
                    request.CampaignId,
                    userId,
                    $"creative_idea_{request.RequestType}",
                    promptSnapshot,
                    response
                );
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error saving creative idea to database: {Error}", ex.Message);
                // Don't fail the request if saving fails
            }

            stopwatch.Stop();
            await LogAiRequestAsync("/ai/creative-idea", request.CampaignId, (int)stopwatch.ElapsedMilliseconds, statusCode);
            
            return Ok(response);
        }
        catch (ArgumentException ex)
        {
            statusCode = 400;
            stopwatch.Stop();
            await LogAiRequestAsync("/ai/creative-idea", request.CampaignId, (int)stopwatch.ElapsedMilliseconds, statusCode);
            return BadRequest(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            statusCode = 500;
            stopwatch.Stop();
            await LogAiRequestAsync("/ai/creative-idea", request.CampaignId, (int)stopwatch.ElapsedMilliseconds, statusCode);
            _logger.LogError(ex, "Invalid operation error generating creative idea");
            return StatusCode(500, new { message = ex.Message });
        }
        catch (Exception ex)
        {
            statusCode = 500;
            stopwatch.Stop();
            await LogAiRequestAsync("/ai/creative-idea", request.CampaignId, (int)stopwatch.ElapsedMilliseconds, statusCode);
            _logger.LogError(ex, "Error generating creative idea: {Error}", ex.ToString());
            return StatusCode(500, new { message = $"An error occurred while generating creative idea: {ex.Message}" });
        }
    }

    /// <summary>
    /// Campaign suggestion report'u PDF olarak export et (mevcut response'dan)
    /// </summary>
    [HttpPost("campaign-suggestion/export-pdf")]
    public async Task<IActionResult> ExportCampaignSuggestionPdf(
        [FromBody] CampaignSuggestionResponseDto response)
    {
        var stopwatch = Stopwatch.StartNew();
        int statusCode = 200;
        
        try
        {
            var campaign = await _campaignService.GetCampaignByIdAsync(response.CampaignId);
            if (campaign == null)
            {
                statusCode = 404;
                stopwatch.Stop();
                await LogAiRequestAsync("/ai/campaign-suggestion/export-pdf", response.CampaignId, (int)stopwatch.ElapsedMilliseconds, statusCode);
                return NotFound(new { message = "Campaign not found" });
            }

            var pdfBytes = await _pdfService.GenerateCampaignReportPdfAsync(
                response, 
                campaign.Title, 
                campaign.ClientName
            );

            stopwatch.Stop();
            await LogAiRequestAsync("/ai/campaign-suggestion/export-pdf", response.CampaignId, (int)stopwatch.ElapsedMilliseconds, statusCode);

            var fileName = $"Campaign_Report_{campaign.Title.Replace(" ", "_")}_{DateTime.Now:yyyyMMdd}.pdf";
            return File(pdfBytes, "application/pdf", fileName);
        }
        catch (Exception ex)
        {
            statusCode = 500;
            stopwatch.Stop();
            await LogAiRequestAsync("/ai/campaign-suggestion/export-pdf", response.CampaignId, (int)stopwatch.ElapsedMilliseconds, statusCode);
            _logger.LogError(ex, "Error generating PDF for campaign suggestion");
            return StatusCode(500, new { message = $"Error generating PDF: {ex.Message}" });
        }
    }

    /// <summary>
    /// Creative idea report'u PDF olarak export et (mevcut response'dan)
    /// </summary>
    [HttpPost("creative-idea/export-pdf")]
    public async Task<IActionResult> ExportCreativeIdeaPdf(
        [FromBody] CreativeIdeaResponseDto response)
    {
        var stopwatch = Stopwatch.StartNew();
        int statusCode = 200;
        
        try
        {
            var campaign = await _campaignService.GetCampaignByIdAsync(response.CampaignId);
            if (campaign == null)
            {
                statusCode = 404;
                stopwatch.Stop();
                await LogAiRequestAsync("/ai/creative-idea/export-pdf", response.CampaignId, (int)stopwatch.ElapsedMilliseconds, statusCode);
                return NotFound(new { message = "Campaign not found" });
            }

            var pdfBytes = await _pdfService.GenerateCreativeIdeaPdfAsync(
                response, 
                campaign.Title, 
                campaign.ClientName
            );

            stopwatch.Stop();
            await LogAiRequestAsync("/ai/creative-idea/export-pdf", response.CampaignId, (int)stopwatch.ElapsedMilliseconds, statusCode);

            var fileName = $"Creative_Ideas_{campaign.Title.Replace(" ", "_")}_{DateTime.Now:yyyyMMdd}.pdf";
            return File(pdfBytes, "application/pdf", fileName);
        }
        catch (Exception ex)
        {
            statusCode = 500;
            stopwatch.Stop();
            await LogAiRequestAsync("/ai/creative-idea/export-pdf", response.CampaignId, (int)stopwatch.ElapsedMilliseconds, statusCode);
            _logger.LogError(ex, "Error generating PDF for creative idea");
            return StatusCode(500, new { message = $"Error generating PDF: {ex.Message}" });
        }
    }
}

