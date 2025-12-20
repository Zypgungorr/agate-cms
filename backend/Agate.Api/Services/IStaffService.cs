using Agate.Api.DTOs;

namespace Agate.Api.Services;

public interface IStaffService
{
    // Staff CRUD
    Task<IEnumerable<StaffListDto>> GetStaffListAsync(bool includeInactive = false);
    Task<StaffDto?> GetStaffByIdAsync(Guid id);
    Task<StaffDto> CreateStaffAsync(CreateStaffDto createDto);
    Task<StaffDto?> UpdateStaffAsync(Guid id, UpdateStaffDto updateDto);
    Task<bool> ChangeStaffPasswordAsync(Guid id, ChangeStaffPasswordDto passwordDto);
    Task<bool> DeleteStaffAsync(Guid id);
    
    // Campaign assignments
    Task<IEnumerable<CampaignAssignmentDto>> GetStaffCampaignAssignmentsAsync(Guid staffId);
    Task<bool> AssignStaffToCampaignAsync(Guid campaignId, AssignStaffToCampaignDto assignDto);
    Task<bool> RemoveStaffFromCampaignAsync(Guid campaignId, Guid staffId);
    Task<IEnumerable<StaffListDto>> GetCampaignStaffAsync(Guid campaignId);
    
    // Client assignments
    Task<IEnumerable<ClientContactDto>> GetStaffClientContactsAsync(Guid staffId);
    Task<bool> AssignStaffToClientAsync(Guid clientId, AssignStaffToClientDto assignDto);
    Task<bool> RemoveStaffFromClientAsync(Guid clientId, Guid staffId);
    Task<IEnumerable<StaffListDto>> GetClientStaffContactsAsync(Guid clientId);
    
    // Performance & workload
    Task<IEnumerable<StaffPerformanceDto>> GetStaffPerformanceAsync();
}

