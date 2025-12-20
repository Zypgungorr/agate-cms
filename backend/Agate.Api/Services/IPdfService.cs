using Agate.Api.DTOs;

namespace Agate.Api.Services;

public interface IPdfService
{
    Task<byte[]> GenerateCampaignReportPdfAsync(CampaignSuggestionResponseDto report, string campaignTitle, string clientName);
    Task<byte[]> GenerateCreativeIdeaPdfAsync(CreativeIdeaResponseDto report, string campaignTitle, string clientName);
}

