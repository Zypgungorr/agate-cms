using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using Agate.Api.Services;
using Agate.Api.Dtos;

namespace Agate.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ConceptNotesController : ControllerBase
{
    private readonly IConceptNoteService _conceptNoteService;

    public ConceptNotesController(IConceptNoteService conceptNoteService)
    {
        _conceptNoteService = conceptNoteService;
    }

    /// <summary>
    /// Get all concept notes with optional filtering
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<IEnumerable<ConceptNoteListDto>>> GetConceptNotes(
        [FromQuery] Guid? campaignId = null, 
        [FromQuery] string? status = null)
    {
        try
        {
            var conceptNotes = await _conceptNoteService.GetAllConceptNotesAsync(campaignId, status);
            return Ok(conceptNotes);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = ex.Message });
        }
    }

    /// <summary>
    /// Get specific concept note by ID
    /// </summary>
    [HttpGet("{id}")]
    public async Task<ActionResult<ConceptNoteDto>> GetConceptNote(Guid id)
    {
        try
        {
            var conceptNote = await _conceptNoteService.GetConceptNoteByIdAsync(id);
            
            if (conceptNote == null)
            {
                return NotFound(new { error = "Concept note not found" });
            }

            return Ok(conceptNote);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = ex.Message });
        }
    }

    /// <summary>
    /// Get all concept notes for a specific campaign
    /// </summary>
    [HttpGet("campaign/{campaignId}")]
    public async Task<ActionResult<IEnumerable<ConceptNoteListDto>>> GetConceptNotesByCampaign(Guid campaignId)
    {
        try
        {
            var conceptNotes = await _conceptNoteService.GetConceptNotesByCampaignAsync(campaignId);
            return Ok(conceptNotes);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = ex.Message });
        }
    }

    /// <summary>
    /// Create a new concept note
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<ConceptNoteDto>> CreateConceptNote(CreateConceptNoteDto createDto)
    {
        try
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!Guid.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized(new { error = "Invalid user token" });
            }

            var conceptNote = await _conceptNoteService.CreateConceptNoteAsync(createDto, userId);
            return CreatedAtAction(nameof(GetConceptNote), new { id = conceptNote.Id }, conceptNote);
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
    /// Update an existing concept note
    /// </summary>
    [HttpPut("{id}")]
    public async Task<ActionResult<ConceptNoteDto>> UpdateConceptNote(Guid id, UpdateConceptNoteDto updateDto)
    {
        try
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!Guid.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized(new { error = "Invalid user token" });
            }

            var conceptNote = await _conceptNoteService.UpdateConceptNoteAsync(id, updateDto, userId);
            
            if (conceptNote == null)
            {
                return NotFound(new { error = "Concept note not found" });
            }

            return Ok(conceptNote);
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
    /// Update concept note status (for drag & drop)
    /// </summary>
    [HttpPatch("{id}/status")]
    public async Task<ActionResult<ConceptNoteDto>> UpdateConceptNoteStatus(Guid id, UpdateConceptNoteStatusDto statusDto)
    {
        try
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!Guid.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized(new { error = "Invalid user token" });
            }

            var conceptNote = await _conceptNoteService.UpdateConceptNoteStatusAsync(id, statusDto.Status, userId);
            
            if (conceptNote == null)
            {
                return NotFound(new { error = "Concept note not found" });
            }

            return Ok(conceptNote);
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
    /// Delete a concept note
    /// </summary>
    [HttpDelete("{id}")]
    public async Task<ActionResult> DeleteConceptNote(Guid id)
    {
        try
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!Guid.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized(new { error = "Invalid user token" });
            }

            var deleted = await _conceptNoteService.DeleteConceptNoteAsync(id, userId);
            
            if (!deleted)
            {
                return NotFound(new { error = "Concept note not found or access denied" });
            }

            return NoContent();
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = ex.Message });
        }
    }

    /// <summary>
    /// Get concept note statuses for kanban board
    /// </summary>
    [HttpGet("statuses")]
    public ActionResult<string[]> GetStatuses()
    {
        var statuses = new[] { "Ideas", "InReview", "Approved", "Archived" };
        return Ok(statuses);
    }
}
