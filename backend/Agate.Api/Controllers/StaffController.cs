using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Agate.Api.Services;
using Agate.Api.DTOs;

namespace Agate.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class StaffController : ControllerBase
{
    private readonly IStaffService _staffService;

    public StaffController(IStaffService staffService)
    {
        _staffService = staffService;
    }

    // GET: api/staff
    [HttpGet]
    public async Task<ActionResult<IEnumerable<StaffListDto>>> GetStaff([FromQuery] bool includeInactive = false)
    {
        var staff = await _staffService.GetStaffListAsync(includeInactive);
        return Ok(staff);
    }

    // GET: api/staff/{id}
    [HttpGet("{id}")]
    public async Task<ActionResult<StaffDto>> GetStaff(Guid id)
    {
        var staff = await _staffService.GetStaffByIdAsync(id);
        
        if (staff == null)
        {
            return NotFound();
        }

        return Ok(staff);
    }

    // POST: api/staff
    [HttpPost]
    public async Task<ActionResult<StaffDto>> CreateStaff([FromBody] CreateStaffDto createDto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        try
        {
            var staff = await _staffService.CreateStaffAsync(createDto);
            return CreatedAtAction(nameof(GetStaff), new { id = staff.Id }, staff);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    // PUT: api/staff/{id}
    [HttpPut("{id}")]
    public async Task<ActionResult<StaffDto>> UpdateStaff(Guid id, [FromBody] UpdateStaffDto updateDto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        try
        {
            var staff = await _staffService.UpdateStaffAsync(id, updateDto);
            
            if (staff == null)
            {
                return NotFound();
            }

            return Ok(staff);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    // POST: api/staff/{id}/change-password
    [HttpPost("{id}/change-password")]
    public async Task<IActionResult> ChangePassword(Guid id, [FromBody] ChangeStaffPasswordDto passwordDto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var result = await _staffService.ChangeStaffPasswordAsync(id, passwordDto);
        
        if (!result)
        {
            return NotFound();
        }

        return NoContent();
    }

    // DELETE: api/staff/{id}
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteStaff(Guid id)
    {
        try
        {
            var result = await _staffService.DeleteStaffAsync(id);
            
            if (!result)
            {
                return NotFound();
            }

            return NoContent();
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    // GET: api/staff/{id}/campaigns
    [HttpGet("{id}/campaigns")]
    public async Task<ActionResult<IEnumerable<CampaignAssignmentDto>>> GetStaffCampaigns(Guid id)
    {
        var campaigns = await _staffService.GetStaffCampaignAssignmentsAsync(id);
        return Ok(campaigns);
    }

    // GET: api/staff/{id}/clients
    [HttpGet("{id}/clients")]
    public async Task<ActionResult<IEnumerable<ClientContactDto>>> GetStaffClients(Guid id)
    {
        var clients = await _staffService.GetStaffClientContactsAsync(id);
        return Ok(clients);
    }

    // GET: api/staff/performance
    [HttpGet("performance")]
    public async Task<ActionResult<IEnumerable<StaffPerformanceDto>>> GetStaffPerformance()
    {
        var performance = await _staffService.GetStaffPerformanceAsync();
        return Ok(performance);
    }
}

