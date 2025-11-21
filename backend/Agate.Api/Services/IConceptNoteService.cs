using Agate.Api.Models;
using Agate.Api.Dtos;

namespace Agate.Api.Services;

public interface IConceptNoteService
{
    Task<IEnumerable<ConceptNoteListDto>> GetAllConceptNotesAsync(Guid? campaignId = null, string? status = null);
    Task<ConceptNoteDto?> GetConceptNoteByIdAsync(Guid id);
    Task<IEnumerable<ConceptNoteListDto>> GetConceptNotesByCampaignAsync(Guid campaignId);
    Task<ConceptNoteDto> CreateConceptNoteAsync(CreateConceptNoteDto createDto, Guid authorId);
    Task<ConceptNoteDto?> UpdateConceptNoteAsync(Guid id, UpdateConceptNoteDto updateDto, Guid userId);
    Task<ConceptNoteDto?> UpdateConceptNoteStatusAsync(Guid id, string status, Guid userId);
    Task<bool> DeleteConceptNoteAsync(Guid id, Guid userId);
}
