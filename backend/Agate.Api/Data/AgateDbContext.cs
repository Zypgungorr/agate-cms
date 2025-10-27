using Microsoft.EntityFrameworkCore;
using Agate.Api.Models;

namespace Agate.Api.Data;

public class AgateDbContext : DbContext
{
    public AgateDbContext(DbContextOptions<AgateDbContext> options) : base(options)
    {
    }

    // DbSets for all entities
    public DbSet<User> Users { get; set; } = null!;
    public DbSet<Role> Roles { get; set; } = null!;
    public DbSet<UserRole> UserRoles { get; set; } = null!;
    public DbSet<Client> Clients { get; set; } = null!;
    public DbSet<ClientStaffContact> ClientStaffContacts { get; set; } = null!;
    public DbSet<Campaign> Campaigns { get; set; } = null!;
    public DbSet<CampaignStaff> CampaignStaff { get; set; } = null!;
    public DbSet<Advert> Adverts { get; set; } = null!;
    public DbSet<ConceptNote> ConceptNotes { get; set; } = null!;
    public DbSet<BudgetLine> BudgetLines { get; set; } = null!;
    public DbSet<AiSuggestion> AiSuggestions { get; set; } = null!;
    public DbSet<AiAuditLog> AiAuditLogs { get; set; } = null!;

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // No enum mapping needed - using strings directly

        // Table names to match PostgreSQL schema
        modelBuilder.Entity<User>().ToTable("users");
        modelBuilder.Entity<Role>().ToTable("roles");
        modelBuilder.Entity<UserRole>().ToTable("user_roles");
        modelBuilder.Entity<Client>().ToTable("clients");
        modelBuilder.Entity<ClientStaffContact>().ToTable("client_staff_contacts");
        modelBuilder.Entity<Campaign>().ToTable("campaigns");
        modelBuilder.Entity<CampaignStaff>().ToTable("campaign_staff");
        modelBuilder.Entity<Advert>().ToTable("adverts");
        modelBuilder.Entity<ConceptNote>().ToTable("concept_notes");
        modelBuilder.Entity<BudgetLine>().ToTable("budget_lines");
        modelBuilder.Entity<AiSuggestion>().ToTable("ai_suggestions");
        modelBuilder.Entity<AiAuditLog>().ToTable("ai_audit_logs");

        // User configurations
        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(u => u.Id);
            entity.Property(u => u.Id).HasColumnName("id").HasDefaultValueSql("gen_random_uuid()");
            entity.HasIndex(u => u.Email).IsUnique();
            entity.Property(u => u.Email).HasColumnName("email").HasColumnType("citext");
            entity.Property(u => u.PasswordHash).HasColumnName("password_hash");
            entity.Property(u => u.FullName).HasColumnName("full_name");
            entity.Property(u => u.Title).HasColumnName("title");
            entity.Property(u => u.Office).HasColumnName("office");
            entity.Property(u => u.IsActive).HasColumnName("is_active").HasDefaultValue(true);
            entity.Property(u => u.CreatedAt).HasColumnName("created_at").HasDefaultValueSql("now()");
            entity.Property(u => u.UpdatedAt).HasColumnName("updated_at").HasDefaultValueSql("now()");
        });

        // Role configurations - explicitly specify column type
        modelBuilder.Entity<Role>(entity =>
        {
            entity.HasKey(r => r.Id);
            entity.Property(r => r.Id).HasColumnName("id");
            entity.Property(r => r.Key).HasColumnName("key").HasColumnType("text");
            entity.Property(r => r.Name).HasColumnName("name");
            entity.HasIndex(r => r.Key).IsUnique();
        });

        // UserRole configurations (junction table)
        modelBuilder.Entity<UserRole>(entity =>
        {
            entity.HasKey(ur => new { ur.UserId, ur.RoleId });
            entity.Property(ur => ur.UserId).HasColumnName("user_id");
            entity.Property(ur => ur.RoleId).HasColumnName("role_id");
            
            entity.HasOne(ur => ur.User)
                  .WithMany(u => u.UserRoles)
                  .HasForeignKey(ur => ur.UserId)
                  .OnDelete(DeleteBehavior.Cascade);
                  
            entity.HasOne(ur => ur.Role)
                  .WithMany(r => r.UserRoles)
                  .HasForeignKey(ur => ur.RoleId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        // Client configurations
        modelBuilder.Entity<Client>(entity =>
        {
            entity.HasKey(c => c.Id);
            entity.Property(c => c.Id).HasColumnName("id").HasDefaultValueSql("gen_random_uuid()");
            entity.Property(c => c.Name).HasColumnName("name");
            entity.Property(c => c.Address).HasColumnName("address");
            entity.Property(c => c.ContactEmail).HasColumnName("contact_email").HasColumnType("citext");
            entity.Property(c => c.ContactPhone).HasColumnName("contact_phone");
            entity.Property(c => c.Notes).HasColumnName("notes");
            entity.Property(c => c.CreatedAt).HasColumnName("created_at").HasDefaultValueSql("now()");
            entity.Property(c => c.UpdatedAt).HasColumnName("updated_at").HasDefaultValueSql("now()");
            
            entity.HasIndex(c => c.Name).IsUnique();
        });

        // ClientStaffContact configurations
        modelBuilder.Entity<ClientStaffContact>(entity =>
        {
            entity.HasKey(csc => new { csc.ClientId, csc.StaffId });
            entity.Property(csc => csc.ClientId).HasColumnName("client_id");
            entity.Property(csc => csc.StaffId).HasColumnName("staff_id");
            entity.Property(csc => csc.IsPrimary).HasColumnName("is_primary").HasDefaultValue(false);
            entity.Property(csc => csc.CreatedAt).HasColumnName("created_at").HasDefaultValueSql("now()");
            
            entity.HasOne(csc => csc.Client)
                  .WithMany(c => c.ClientStaffContacts)
                  .HasForeignKey(csc => csc.ClientId)
                  .OnDelete(DeleteBehavior.Cascade);
                  
            entity.HasOne(csc => csc.Staff)
                  .WithMany(u => u.ClientStaffContacts)
                  .HasForeignKey(csc => csc.StaffId)
                  .OnDelete(DeleteBehavior.Restrict);
        });

        // Campaign configurations
        modelBuilder.Entity<Campaign>(entity =>
        {
            entity.HasKey(c => c.Id);
            entity.Property(c => c.Id).HasColumnName("id").HasDefaultValueSql("gen_random_uuid()");
            entity.Property(c => c.ClientId).HasColumnName("client_id");
            entity.Property(c => c.Title).HasColumnName("title");
            entity.Property(c => c.Description).HasColumnName("description");
            entity.Property(c => c.Status).HasColumnName("status")
                  .HasColumnType("text").HasDefaultValue(CampaignStatusValues.Planned);
            entity.Property(c => c.StartDate).HasColumnName("start_date");
            entity.Property(c => c.EndDate).HasColumnName("end_date");
            entity.Property(c => c.EstimatedBudget).HasColumnName("estimated_budget").HasPrecision(14, 2).HasDefaultValue(0);
            entity.Property(c => c.ActualCost).HasColumnName("actual_cost").HasPrecision(14, 2).HasDefaultValue(0);
            entity.Property(c => c.CreatedBy).HasColumnName("created_by");
            entity.Property(c => c.CreatedAt).HasColumnName("created_at").HasDefaultValueSql("now()");
            entity.Property(c => c.UpdatedAt).HasColumnName("updated_at").HasDefaultValueSql("now()");
            
            // Relationships
            entity.HasOne(c => c.Client)
                  .WithMany(cl => cl.Campaigns)
                  .HasForeignKey(c => c.ClientId)
                  .OnDelete(DeleteBehavior.Cascade);
                  
            entity.HasOne(c => c.Creator)
                  .WithMany(u => u.CreatedCampaigns)
                  .HasForeignKey(c => c.CreatedBy)
                  .OnDelete(DeleteBehavior.SetNull);
        });

        // CampaignStaff configurations
        modelBuilder.Entity<CampaignStaff>(entity =>
        {
            entity.HasKey(cs => new { cs.CampaignId, cs.StaffId });
            entity.Property(cs => cs.CampaignId).HasColumnName("campaign_id");
            entity.Property(cs => cs.StaffId).HasColumnName("staff_id");
            entity.Property(cs => cs.Role).HasColumnName("role")
                  .HasColumnType("text").HasDefaultValue(RoleKeys.Creative);
            entity.Property(cs => cs.AssignedAt).HasColumnName("assigned_at").HasDefaultValueSql("now()");
            
            entity.HasOne(cs => cs.Campaign)
                  .WithMany(c => c.CampaignStaff)
                  .HasForeignKey(cs => cs.CampaignId)
                  .OnDelete(DeleteBehavior.Cascade);
                  
            entity.HasOne(cs => cs.Staff)
                  .WithMany(u => u.CampaignAssignments)
                  .HasForeignKey(cs => cs.StaffId)
                  .OnDelete(DeleteBehavior.Restrict);
        });

        // Advert configurations
        modelBuilder.Entity<Advert>(entity =>
        {
            entity.HasKey(a => a.Id);
            entity.Property(a => a.Id).HasColumnName("id").HasDefaultValueSql("gen_random_uuid()");
            entity.Property(a => a.CampaignId).HasColumnName("campaign_id");
            entity.Property(a => a.Title).HasColumnName("title");
            entity.Property(a => a.Channel).HasColumnName("channel");
            entity.Property(a => a.Status).HasColumnName("status")
                  .HasColumnType("text").HasDefaultValue(AdvertStatusValues.Backlog);
            entity.Property(a => a.PublishStart).HasColumnName("publish_start");
            entity.Property(a => a.PublishEnd).HasColumnName("publish_end");
            entity.Property(a => a.OwnerId).HasColumnName("owner_id");
            entity.Property(a => a.Cost).HasColumnName("cost").HasPrecision(14, 2).HasDefaultValue(0);
            entity.Property(a => a.Notes).HasColumnName("notes");
            entity.Property(a => a.CreatedAt).HasColumnName("created_at").HasDefaultValueSql("now()");
            entity.Property(a => a.UpdatedAt).HasColumnName("updated_at").HasDefaultValueSql("now()");
            
            entity.HasOne(a => a.Campaign)
                  .WithMany(c => c.Adverts)
                  .HasForeignKey(a => a.CampaignId)
                  .OnDelete(DeleteBehavior.Cascade);
                  
            entity.HasOne(a => a.Owner)
                  .WithMany(u => u.OwnedAdverts)
                  .HasForeignKey(a => a.OwnerId)
                  .OnDelete(DeleteBehavior.SetNull);
        });

        // ConceptNote configurations
        modelBuilder.Entity<ConceptNote>(entity =>
        {
            entity.HasKey(cn => cn.Id);
            entity.Property(cn => cn.Id).HasColumnName("id").HasDefaultValueSql("gen_random_uuid()");
            entity.Property(cn => cn.CampaignId).HasColumnName("campaign_id");
            entity.Property(cn => cn.AuthorId).HasColumnName("author_id");
            entity.Property(cn => cn.Title).HasColumnName("title");
            entity.Property(cn => cn.Content).HasColumnName("content");
            entity.Property(cn => cn.Tags).HasColumnName("tags");
            entity.Property(cn => cn.IsShared).HasColumnName("is_shared").HasDefaultValue(true);
            entity.Property(cn => cn.CreatedAt).HasColumnName("created_at").HasDefaultValueSql("now()");
            entity.Property(cn => cn.UpdatedAt).HasColumnName("updated_at").HasDefaultValueSql("now()");
            
            entity.HasOne(cn => cn.Campaign)
                  .WithMany(c => c.ConceptNotes)
                  .HasForeignKey(cn => cn.CampaignId)
                  .OnDelete(DeleteBehavior.Cascade);
                  
            entity.HasOne(cn => cn.Author)
                  .WithMany(u => u.ConceptNotes)
                  .HasForeignKey(cn => cn.AuthorId)
                  .OnDelete(DeleteBehavior.Restrict);
        });

        // BudgetLine configurations
        modelBuilder.Entity<BudgetLine>(entity =>
        {
            entity.HasKey(bl => bl.Id);
            entity.Property(bl => bl.Id).HasColumnName("id");
            entity.Property(bl => bl.CampaignId).HasColumnName("campaign_id");
            entity.Property(bl => bl.AdvertId).HasColumnName("advert_id");
            entity.Property(bl => bl.Item).HasColumnName("item");
            entity.Property(bl => bl.Amount).HasColumnName("amount").HasPrecision(14, 2);
            entity.Property(bl => bl.BookedAt).HasColumnName("booked_at");
            
            entity.HasOne(bl => bl.Campaign)
                  .WithMany(c => c.BudgetLines)
                  .HasForeignKey(bl => bl.CampaignId)
                  .OnDelete(DeleteBehavior.Cascade);
                  
            entity.HasOne(bl => bl.Advert)
                  .WithMany(a => a.BudgetLines)
                  .HasForeignKey(bl => bl.AdvertId)
                  .OnDelete(DeleteBehavior.SetNull);
        });

        // AiSuggestion configurations
        modelBuilder.Entity<AiSuggestion>(entity =>
        {
            entity.HasKey(ai => ai.Id);
            entity.Property(ai => ai.Id).HasColumnName("id").HasDefaultValueSql("gen_random_uuid()");
            entity.Property(ai => ai.CampaignId).HasColumnName("campaign_id");
            entity.Property(ai => ai.AuthorUserId).HasColumnName("author_user_id");
            entity.Property(ai => ai.Kind).HasColumnName("kind");
            entity.Property(ai => ai.PromptSnapshot).HasColumnName("prompt_snapshot").HasColumnType("jsonb");
            entity.Property(ai => ai.Result).HasColumnName("result").HasColumnType("jsonb");
            entity.Property(ai => ai.Accepted).HasColumnName("accepted");
            entity.Property(ai => ai.CreatedAt).HasColumnName("created_at").HasDefaultValueSql("now()");
        });

        // AiAuditLog configurations
        modelBuilder.Entity<AiAuditLog>(entity =>
        {
            entity.HasKey(aa => aa.Id);
            entity.Property(aa => aa.Id).HasColumnName("id");
            entity.Property(aa => aa.UserId).HasColumnName("user_id");
            entity.Property(aa => aa.Route).HasColumnName("route");
            entity.Property(aa => aa.CampaignId).HasColumnName("campaign_id");
            entity.Property(aa => aa.LatencyMs).HasColumnName("latency_ms");
            entity.Property(aa => aa.StatusCode).HasColumnName("status_code");
            entity.Property(aa => aa.CreatedAt).HasColumnName("created_at").HasDefaultValueSql("now()");
        });
    }
}
