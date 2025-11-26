using Agate.Api.DTOs;

namespace Agate.Api.Services;

public interface ICampaignService
{
    Task<IEnumerable<CampaignListDto>> GetCampaignsAsync(string? status = null, Guid? clientId = null);
    Task<CampaignDto?> GetCampaignByIdAsync(Guid id);
    Task<CampaignDto> CreateCampaignAsync(CreateCampaignDto createDto, Guid createdById);
    Task<CampaignDto?> UpdateCampaignAsync(Guid id, UpdateCampaignDto updateDto);
    Task<bool> DeleteCampaignAsync(Guid id);
    Task<IEnumerable<CampaignListDto>> GetCampaignsByClientAsync(Guid clientId);
}
