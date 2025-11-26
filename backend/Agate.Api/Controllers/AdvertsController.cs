using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Agate.Api.Services;
using Agate.Api.Dtos;

namespace Agate.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class AdvertsController : ControllerBase
{
    private readonly IAdvertService _advertService;

    public AdvertsController(IAdvertService advertService)
    {
        _advertService = advertService;
    }

    /// <summary>
    /// Get all adverts with optional filtering
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<IEnumerable<AdvertListDto>>> GetAdverts(
        [FromQuery] Guid? campaignId = null, 
        [FromQuery] string? status = null)
    {
        try
        {
            var adverts = await _advertService.GetAllAdvertsAsync(campaignId, status);
            return Ok(adverts);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = ex.Message });
        }
    }

    /// <summary>
    /// Get specific advert by ID
    /// </summary>
    [HttpGet("{id}")]
    public async Task<ActionResult<AdvertDto>> GetAdvert(Guid id)
    {
        try
        {
            var advert = await _advertService.GetAdvertByIdAsync(id);
            
            if (advert == null)
            {
                return NotFound(new { error = "Advert not found" });
            }

            return Ok(advert);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = ex.Message });
        }
    }

    /// <summary>
    /// Get all adverts for a specific campaign
    /// </summary>
    [HttpGet("campaign/{campaignId}")]
    public async Task<ActionResult<IEnumerable<AdvertListDto>>> GetAdvertsByCampaign(Guid campaignId)
    {
        try
        {
            var adverts = await _advertService.GetAdvertsByCampaignAsync(campaignId);
            return Ok(adverts);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = ex.Message });
        }
    }

    /// <summary>
    /// Create a new advert
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<AdvertDto>> CreateAdvert(CreateAdvertDto createDto)
    {
        try
        {
            var advert = await _advertService.CreateAdvertAsync(createDto);
            return CreatedAtAction(nameof(GetAdvert), new { id = advert.Id }, advert);
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
    /// Update an existing advert
    /// </summary>
    [HttpPut("{id}")]
    public async Task<ActionResult<AdvertDto>> UpdateAdvert(Guid id, UpdateAdvertDto updateDto)
    {
        try
        {
            var advert = await _advertService.UpdateAdvertAsync(id, updateDto);
            
            if (advert == null)
            {
                return NotFound(new { error = "Advert not found" });
            }

            return Ok(advert);
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
    /// Delete an advert
    /// </summary>
    [HttpDelete("{id}")]
    public async Task<ActionResult> DeleteAdvert(Guid id)
    {
        try
        {
            var deleted = await _advertService.DeleteAdvertAsync(id);
            
            if (!deleted)
            {
                return NotFound(new { error = "Advert not found" });
            }

            return NoContent();
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = ex.Message });
        }
    }
}
