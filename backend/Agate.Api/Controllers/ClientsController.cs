using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Agate.Api.Services;
using Agate.Api.DTOs;

namespace Agate.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ClientsController : ControllerBase
{
    private readonly IClientService _clientService;

    public ClientsController(IClientService clientService)
    {
        _clientService = clientService;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<ClientListDto>>> GetClients()
    {
        var clients = await _clientService.GetClientsAsync();
        return Ok(clients);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ClientDto>> GetClient(Guid id)
    {
        var client = await _clientService.GetClientByIdAsync(id);
        
        if (client == null)
        {
            return NotFound();
        }

        return Ok(client);
    }

    [HttpPost]
    public async Task<ActionResult<ClientDto>> CreateClient([FromBody] CreateClientDto createDto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        try
        {
            var client = await _clientService.CreateClientAsync(createDto);
            return CreatedAtAction(nameof(GetClient), new { id = client.Id }, client);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<ClientDto>> UpdateClient(Guid id, [FromBody] UpdateClientDto updateDto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        try
        {
            var client = await _clientService.UpdateClientAsync(id, updateDto);
            
            if (client == null)
            {
                return NotFound();
            }

            return Ok(client);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteClient(Guid id)
    {
        try
        {
            var result = await _clientService.DeleteClientAsync(id);
            
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
}
