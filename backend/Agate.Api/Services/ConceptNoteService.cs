using Microsoft.EntityFrameworkCore;
using Agate.Api.Data;
using Agate.Api.Models;
using Agate.Api.Dtos;

namespace Agate.Api.Services;

public class ConceptNoteService : IConceptNoteService
{
    private readonly AgateDbContext _context;

    public ConceptNoteService(AgateDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<ConceptNoteListDto>> GetAllConceptNotesAsync(Guid? campaignId = null, string? status = null)
    {
        var query = _context.ConceptNotes
            .Include(cn => cn.Campaign)
            .Include(cn => cn.Author)
            .AsQueryable();

        if (campaignId.HasValue)
        {
            query = query.Where(cn => cn.CampaignId == campaignId.Value);
        }

        if (!string.IsNullOrEmpty(status))
        {
            query = query.Where(cn => cn.Status == status);
        }

        return await query
            .Select(cn => new ConceptNoteListDto
            {
                Id = cn.Id,
                CampaignId = cn.CampaignId,
                CampaignName = cn.Campaign.Title,
                AuthorName = cn.Author.FullName,
                Title = cn.Title,
                Content = cn.Content,
                Status = cn.Status,
                Tags = cn.Tags,
                Priority = cn.Priority,
                IsShared = cn.IsShared,
                CreatedAt = cn.CreatedAt,
                UpdatedAt = cn.UpdatedAt
            })
            .OrderByDescending(cn => cn.CreatedAt)
            .ToListAsync();
    }

    public async Task<ConceptNoteDto?> GetConceptNoteByIdAsync(Guid id)
    {
        var conceptNote = await _context.ConceptNotes
            .Include(cn => cn.Campaign)
            .Include(cn => cn.Author)
            .FirstOrDefaultAsync(cn => cn.Id == id);

        if (conceptNote == null)
        {
            return null;
        }

        return new ConceptNoteDto
        {
            Id = conceptNote.Id,
            CampaignId = conceptNote.CampaignId,
            CampaignName = conceptNote.Campaign.Title,
            AuthorId = conceptNote.AuthorId,
            AuthorName = conceptNote.Author.FullName,
            Title = conceptNote.Title,
            Content = conceptNote.Content,
            Status = conceptNote.Status,
            Tags = conceptNote.Tags,
            Priority = conceptNote.Priority,
            IsShared = conceptNote.IsShared,
            CreatedAt = conceptNote.CreatedAt,
            UpdatedAt = conceptNote.UpdatedAt
        };
    }

    public async Task<IEnumerable<ConceptNoteListDto>> GetConceptNotesByCampaignAsync(Guid campaignId)
    {
        return await _context.ConceptNotes
            .Include(cn => cn.Campaign)
            .Include(cn => cn.Author)
            .Where(cn => cn.CampaignId == campaignId)
            .Select(cn => new ConceptNoteListDto
            {
                Id = cn.Id,
                CampaignId = cn.CampaignId,
                CampaignName = cn.Campaign.Title,
                AuthorName = cn.Author.FullName,
                Title = cn.Title,
                Content = cn.Content,
                Status = cn.Status,
                Tags = cn.Tags,
                Priority = cn.Priority,
                IsShared = cn.IsShared,
                CreatedAt = cn.CreatedAt,
                UpdatedAt = cn.UpdatedAt
            })
            .OrderByDescending(cn => cn.CreatedAt)
            .ToListAsync();
    }

    public async Task<ConceptNoteDto> CreateConceptNoteAsync(CreateConceptNoteDto createDto, Guid authorId)
    {
        // Validate campaign exists
        var campaign = await _context.Campaigns.FindAsync(createDto.CampaignId);
        if (campaign == null)
        {
            throw new ArgumentException("Campaign not found");
        }

        // Validate author exists
        var author = await _context.Users.FindAsync(authorId);
        if (author == null)
        {
            throw new ArgumentException("Author not found");
        }

        // Validate status
        var validStatuses = new[] { "Ideas", "InReview", "Approved", "Archived" };
        if (!validStatuses.Contains(createDto.Status))
        {
            throw new ArgumentException("Invalid status");
        }

        var conceptNote = new ConceptNote
        {
            CampaignId = createDto.CampaignId,
            AuthorId = authorId,
            Title = createDto.Title,
            Content = createDto.Content,
            Status = createDto.Status,
            Tags = createDto.Tags,
            Priority = createDto.Priority,
            IsShared = createDto.IsShared,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.ConceptNotes.Add(conceptNote);
        await _context.SaveChangesAsync();

        // Load related data for return
        await _context.Entry(conceptNote)
            .Reference(cn => cn.Campaign)
            .LoadAsync();

        await _context.Entry(conceptNote)
            .Reference(cn => cn.Author)
            .LoadAsync();

        return new ConceptNoteDto
        {
            Id = conceptNote.Id,
            CampaignId = conceptNote.CampaignId,
            CampaignName = conceptNote.Campaign.Title,
            AuthorId = conceptNote.AuthorId,
            AuthorName = conceptNote.Author.FullName,
            Title = conceptNote.Title,
            Content = conceptNote.Content,
            Status = conceptNote.Status,
            Tags = conceptNote.Tags,
            Priority = conceptNote.Priority,
            IsShared = conceptNote.IsShared,
            CreatedAt = conceptNote.CreatedAt,
            UpdatedAt = conceptNote.UpdatedAt
        };
    }

    public async Task<ConceptNoteDto?> UpdateConceptNoteAsync(Guid id, UpdateConceptNoteDto updateDto, Guid userId)
    {
        var conceptNote = await _context.ConceptNotes
            .Include(cn => cn.Campaign)
            .Include(cn => cn.Author)
            .FirstOrDefaultAsync(cn => cn.Id == id);

        if (conceptNote == null)
        {
            return null;
        }

        // Check if user can edit (author or has permission)
        if (conceptNote.AuthorId != userId)
        {
            // TODO: Add role-based permission check
        }

        // Update fields if provided
        if (!string.IsNullOrEmpty(updateDto.Title))
        {
            conceptNote.Title = updateDto.Title;
        }

        if (!string.IsNullOrEmpty(updateDto.Content))
        {
            conceptNote.Content = updateDto.Content;
        }

        if (!string.IsNullOrEmpty(updateDto.Status))
        {
            var validStatuses = new[] { "Ideas", "InReview", "Approved", "Archived" };
            if (validStatuses.Contains(updateDto.Status))
            {
                conceptNote.Status = updateDto.Status;
            }
        }

        if (updateDto.Tags != null)
        {
            conceptNote.Tags = updateDto.Tags;
        }

        if (updateDto.Priority.HasValue)
        {
            conceptNote.Priority = updateDto.Priority.Value;
        }

        if (updateDto.IsShared.HasValue)
        {
            conceptNote.IsShared = updateDto.IsShared.Value;
        }

        conceptNote.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return new ConceptNoteDto
        {
            Id = conceptNote.Id,
            CampaignId = conceptNote.CampaignId,
            CampaignName = conceptNote.Campaign.Title,
            AuthorId = conceptNote.AuthorId,
            AuthorName = conceptNote.Author.FullName,
            Title = conceptNote.Title,
            Content = conceptNote.Content,
            Status = conceptNote.Status,
            Tags = conceptNote.Tags,
            Priority = conceptNote.Priority,
            IsShared = conceptNote.IsShared,
            CreatedAt = conceptNote.CreatedAt,
            UpdatedAt = conceptNote.UpdatedAt
        };
    }

    public async Task<ConceptNoteDto?> UpdateConceptNoteStatusAsync(Guid id, string status, Guid userId)
    {
        var validStatuses = new[] { "Ideas", "InReview", "Approved", "Archived" };
        if (!validStatuses.Contains(status))
        {
            throw new ArgumentException("Invalid status");
        }

        var conceptNote = await _context.ConceptNotes
            .Include(cn => cn.Campaign)
            .Include(cn => cn.Author)
            .FirstOrDefaultAsync(cn => cn.Id == id);

        if (conceptNote == null)
        {
            return null;
        }

        conceptNote.Status = status;
        conceptNote.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return new ConceptNoteDto
        {
            Id = conceptNote.Id,
            CampaignId = conceptNote.CampaignId,
            CampaignName = conceptNote.Campaign.Title,
            AuthorId = conceptNote.AuthorId,
            AuthorName = conceptNote.Author.FullName,
            Title = conceptNote.Title,
            Content = conceptNote.Content,
            Status = conceptNote.Status,
            Tags = conceptNote.Tags,
            Priority = conceptNote.Priority,
            IsShared = conceptNote.IsShared,
            CreatedAt = conceptNote.CreatedAt,
            UpdatedAt = conceptNote.UpdatedAt
        };
    }

    public async Task<bool> DeleteConceptNoteAsync(Guid id, Guid userId)
    {
        var conceptNote = await _context.ConceptNotes.FirstOrDefaultAsync(cn => cn.Id == id);

        if (conceptNote == null)
        {
            return false;
        }

        // Check if user can delete (author or has permission)
        if (conceptNote.AuthorId != userId)
        {
            // TODO: Add role-based permission check
            return false;
        }

        _context.ConceptNotes.Remove(conceptNote);
        await _context.SaveChangesAsync();

        return true;
    }
}
