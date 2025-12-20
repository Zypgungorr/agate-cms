using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using Agate.Api.Services;
using Agate.Api.DTOs;

namespace Agate.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class CampaignsController : ControllerBase
{
    private readonly ICampaignService _campaignService;
    private readonly IStaffService _staffService;

    public CampaignsController(ICampaignService campaignService, IStaffService staffService)
    {
        _campaignService = campaignService;
        _staffService = staffService;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<CampaignListDto>>> GetCampaigns(
        [FromQuery] string? status = null,
        [FromQuery] Guid? clientId = null)
    {
        var campaigns = await _campaignService.GetCampaignsAsync(status, clientId);
        return Ok(campaigns);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<CampaignDto>> GetCampaign(Guid id)
    {
        var campaign = await _campaignService.GetCampaignByIdAsync(id);
        
        if (campaign == null)
        {
            return NotFound();
        }

        return Ok(campaign);
    }

    [HttpPost]
    public async Task<ActionResult<CampaignDto>> CreateCampaign([FromBody] CreateCampaignDto createDto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (userIdClaim == null || !Guid.TryParse(userIdClaim, out var userId))
        {
            return Unauthorized();
        }

        try
        {
            var campaign = await _campaignService.CreateCampaignAsync(createDto, userId);
            return CreatedAtAction(nameof(GetCampaign), new { id = campaign.Id }, campaign);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<CampaignDto>> UpdateCampaign(Guid id, [FromBody] UpdateCampaignDto updateDto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        try
        {
            var campaign = await _campaignService.UpdateCampaignAsync(id, updateDto);
            
            if (campaign == null)
            {
                return NotFound();
            }

            return Ok(campaign);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteCampaign(Guid id)
    {
        var result = await _campaignService.DeleteCampaignAsync(id);
        
        if (!result)
        {
            return NotFound();
        }

        return NoContent();
    }

    [HttpGet("client/{clientId}")]
    public async Task<ActionResult<IEnumerable<CampaignListDto>>> GetCampaignsByClient(Guid clientId)
    {
        var campaigns = await _campaignService.GetCampaignsByClientAsync(clientId);
        return Ok(campaigns);
    }

    [HttpGet("status/{status}")]
    public async Task<ActionResult<IEnumerable<CampaignListDto>>> GetCampaignsByStatus(string status)
    {
        var campaigns = await _campaignService.GetCampaignsAsync(status);
        return Ok(campaigns);
    }

    // Campaign staff management endpoints
    
    // GET: api/campaigns/{id}/staff
    [HttpGet("{id}/staff")]
    public async Task<ActionResult<IEnumerable<StaffListDto>>> GetCampaignStaff(Guid id)
    {
        var staff = await _staffService.GetCampaignStaffAsync(id);
        return Ok(staff);
    }

    // POST: api/campaigns/{id}/staff
    [HttpPost("{id}/staff")]
    public async Task<IActionResult> AssignStaffToCampaign(Guid id, [FromBody] AssignStaffToCampaignDto assignDto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        try
        {
            await _staffService.AssignStaffToCampaignAsync(id, assignDto);
            return NoContent();
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    // DELETE: api/campaigns/{campaignId}/staff/{staffId}
    [HttpDelete("{campaignId}/staff/{staffId}")]
    public async Task<IActionResult> RemoveStaffFromCampaign(Guid campaignId, Guid staffId)
    {
        var result = await _staffService.RemoveStaffFromCampaignAsync(campaignId, staffId);
        
        if (!result)
        {
            return NotFound();
        }

        return NoContent();
    }
}
