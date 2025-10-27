using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using Agate.Api.Services;
using Agate.Api.DTOs;

namespace Agate.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;

    public AuthController(IAuthService authService)
    {
        _authService = authService;
    }

    [HttpPost("login")]
    public async Task<ActionResult<LoginResponseDto>> Login([FromBody] LoginRequestDto request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var result = await _authService.LoginAsync(request);
        if (result == null)
        {
            return Unauthorized(new { message = "Invalid email or password" });
        }

        return Ok(result);
    }

    [HttpPost("register")]
    public async Task<ActionResult<UserDto>> Register([FromBody] RegisterRequestDto request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var result = await _authService.RegisterAsync(request);
        if (result == null)
        {
            return BadRequest(new { message = "Registration failed. User may already exist or invalid data provided." });
        }

        return Created($"/api/auth/profile", result);
    }

    [HttpGet("profile")]
    [Authorize]
    public async Task<ActionResult<UserDto>> GetProfile()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (userIdClaim == null || !Guid.TryParse(userIdClaim, out var userId))
        {
            return Unauthorized();
        }

        var user = await _authService.GetUserByIdAsync(userId);
        if (user == null)
        {
            return NotFound();
        }

        return Ok(user);
    }

    [HttpPost("validate")]
    [Authorize]
    public ActionResult ValidateToken()
    {
        // If the request reaches here, the token is valid (due to [Authorize])
        return Ok(new { valid = true, user = GetCurrentUserInfo() });
    }

    private object GetCurrentUserInfo()
    {
        return new
        {
            Id = User.FindFirst(ClaimTypes.NameIdentifier)?.Value,
            Email = User.FindFirst(ClaimTypes.Email)?.Value,
            Name = User.FindFirst(ClaimTypes.Name)?.Value,
            Roles = User.FindAll(ClaimTypes.Role).Select(c => c.Value).ToList(),
            Office = User.FindFirst("Office")?.Value
        };
    }
}
