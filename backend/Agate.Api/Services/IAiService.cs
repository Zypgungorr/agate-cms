using Agate.Api.DTOs;

namespace Agate.Api.Services;

public interface IAiService
{
    Task<CampaignSuggestionResponseDto> GetCampaignSuggestionAsync(CampaignSuggestionRequestDto request);
    Task<CreativeIdeaResponseDto> GetCreativeIdeaAsync(CreativeIdeaRequestDto request);
    Task<string> GenerateTextAsync(string prompt, Dictionary<string, object>? context = null);
    Task SaveAiSuggestionAsync(Guid campaignId, Guid? authorUserId, string kind, object promptSnapshot, object result);
}

