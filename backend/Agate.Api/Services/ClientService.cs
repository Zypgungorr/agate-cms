using Microsoft.EntityFrameworkCore;
using Agate.Api.Data;
using Agate.Api.DTOs;
using Agate.Api.Models;

namespace Agate.Api.Services;

public interface IClientService
{
    Task<IEnumerable<ClientListDto>> GetClientsAsync();
    Task<ClientDto?> GetClientByIdAsync(Guid id);
    Task<ClientDto> CreateClientAsync(CreateClientDto createDto);
    Task<ClientDto?> UpdateClientAsync(Guid id, UpdateClientDto updateDto);
    Task<bool> DeleteClientAsync(Guid id);
}

public class ClientService : IClientService
{
    private readonly AgateDbContext _context;

    public ClientService(AgateDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<ClientListDto>> GetClientsAsync()
    {
        var clients = await _context.Clients
            .Include(c => c.Campaigns)
            .OrderBy(c => c.Name)
            .Select(c => new ClientListDto
            {
                Id = c.Id,
                Name = c.Name,
                ContactEmail = c.ContactEmail,
                ContactPhone = c.ContactPhone,
                TotalCampaigns = c.Campaigns.Count,
                ActiveCampaigns = c.Campaigns.Count(ca => ca.Status == CampaignStatusValues.Active || ca.Status == CampaignStatusValues.Planned),
                UpdatedAt = c.UpdatedAt
            })
            .ToListAsync();

        return clients;
    }

    public async Task<ClientDto?> GetClientByIdAsync(Guid id)
    {
        var client = await _context.Clients
            .Include(c => c.Campaigns)
            .FirstOrDefaultAsync(c => c.Id == id);

        if (client == null) return null;

        return new ClientDto
        {
            Id = client.Id,
            Name = client.Name,
            Address = client.Address,
            ContactEmail = client.ContactEmail,
            ContactPhone = client.ContactPhone,
            Notes = client.Notes,
            CreatedAt = client.CreatedAt,
            UpdatedAt = client.UpdatedAt,
            TotalCampaigns = client.Campaigns.Count,
            ActiveCampaigns = client.Campaigns.Count(c => c.Status == CampaignStatusValues.Active || c.Status == CampaignStatusValues.Planned),
            TotalSpent = client.Campaigns.Sum(c => c.ActualCost)
        };
    }

    public async Task<ClientDto> CreateClientAsync(CreateClientDto createDto)
    {
        var client = new Client
        {
            Id = Guid.NewGuid(),
            Name = createDto.Name,
            Address = createDto.Address,
            ContactEmail = createDto.ContactEmail,
            ContactPhone = createDto.ContactPhone,
            Notes = createDto.Notes,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Clients.Add(client);
        await _context.SaveChangesAsync();

        return await GetClientByIdAsync(client.Id) ?? throw new InvalidOperationException("Failed to retrieve created client");
    }

    public async Task<ClientDto?> UpdateClientAsync(Guid id, UpdateClientDto updateDto)
    {
        var client = await _context.Clients.FindAsync(id);
        if (client == null) return null;

        client.Name = updateDto.Name;
        client.Address = updateDto.Address;
        client.ContactEmail = updateDto.ContactEmail;
        client.ContactPhone = updateDto.ContactPhone;
        client.Notes = updateDto.Notes;
        client.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return await GetClientByIdAsync(id);
    }

    public async Task<bool> DeleteClientAsync(Guid id)
    {
        var client = await _context.Clients.FindAsync(id);
        if (client == null) return false;

        // Check if client has campaigns
        var hasCampaigns = await _context.Campaigns.AnyAsync(c => c.ClientId == id);
        if (hasCampaigns)
        {
            throw new InvalidOperationException("Cannot delete client with existing campaigns");
        }

        _context.Clients.Remove(client);
        await _context.SaveChangesAsync();
        return true;
    }
}
