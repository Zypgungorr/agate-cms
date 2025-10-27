using Microsoft.EntityFrameworkCore;
using Agate.Api.Data;
using Agate.Api.Models;
using Agate.Api.DTOs;
using BCrypt.Net;

namespace Agate.Api.Services;

public interface IAuthService
{
    Task<LoginResponseDto?> LoginAsync(LoginRequestDto request);
    Task<UserDto?> RegisterAsync(RegisterRequestDto request);
    Task<UserDto?> GetUserByIdAsync(Guid userId);
}

public class AuthService : IAuthService
{
    private readonly AgateDbContext _context;
    private readonly IJwtTokenService _tokenService;

    public AuthService(AgateDbContext context, IJwtTokenService tokenService)
    {
        _context = context;
        _tokenService = tokenService;
    }

    public async Task<LoginResponseDto?> LoginAsync(LoginRequestDto request)
    {
        var user = await _context.Users
            .Include(u => u.UserRoles)
            .ThenInclude(ur => ur.Role)
            .FirstOrDefaultAsync(u => u.Email == request.Email && u.IsActive);

        if (user == null || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
        {
            return null;
        }

        var token = _tokenService.GenerateToken(user);

        return new LoginResponseDto
        {
            Token = token,
            User = MapToUserDto(user)
        };
    }

    public async Task<UserDto?> RegisterAsync(RegisterRequestDto request)
    {
        // Check if user already exists
        if (await _context.Users.AnyAsync(u => u.Email == request.Email))
        {
            return null;
        }

        // Validate roles
        var validRoles = new List<Role>();
        foreach (var roleKey in request.Roles)
        {
            // Convert from PascalCase to snake_case if needed
            var normalizedRole = roleKey switch
            {
                "Admin" => RoleKeys.Admin,
                "AccountManager" => RoleKeys.AccountManager, 
                "Creative" => RoleKeys.Creative,
                "Analyst" => RoleKeys.Analyst,
                _ => roleKey.ToLower()
            };
            
            // Simple string comparison - should work now that Key is text
            var role = await _context.Roles.FirstOrDefaultAsync(r => r.Key == normalizedRole);
            if (role != null)
            {
                validRoles.Add(role);
            }
        }

        if (!validRoles.Any())
        {
            return null; // At least one valid role required
        }

        var user = new User
        {
            Email = request.Email,
            FullName = request.FullName,
            Title = request.Title,
            Office = request.Office,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        // Assign roles
        foreach (var role in validRoles)
        {
            _context.UserRoles.Add(new UserRole
            {
                UserId = user.Id,
                RoleId = role.Id
            });
        }
        
        await _context.SaveChangesAsync();

        // Load the user with roles
        var createdUser = await _context.Users
            .Include(u => u.UserRoles)
            .ThenInclude(ur => ur.Role)
            .FirstAsync(u => u.Id == user.Id);

        return MapToUserDto(createdUser);
    }

    public async Task<UserDto?> GetUserByIdAsync(Guid userId)
    {
        var user = await _context.Users
            .Include(u => u.UserRoles)
            .ThenInclude(ur => ur.Role)
            .FirstOrDefaultAsync(u => u.Id == userId && u.IsActive);

        return user == null ? null : MapToUserDto(user);
    }

    private static UserDto MapToUserDto(User user)
    {
        return new UserDto
        {
            Id = user.Id,
            Email = user.Email,
            FullName = user.FullName,
            Title = user.Title,
            Office = user.Office,
            Roles = user.UserRoles.Select(ur => ur.Role.Key).ToList(),
            IsActive = user.IsActive,
            CreatedAt = user.CreatedAt
        };
    }
}
