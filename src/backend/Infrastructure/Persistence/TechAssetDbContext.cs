using Microsoft.EntityFrameworkCore;
using TechAsset.Application.Interfaces;
using TechAsset.Domain.Entities;
namespace TechAsset.Infrastructure.Persistence;

public class TechAssetDbContext(DbContextOptions<TechAssetDbContext> options, ICurrentUser currentUser) : DbContext(options), IApplicationDbContext
{
    public DbSet<User> Users => Set<User>();
    public DbSet<Equipment> Equipments => Set<Equipment>();
    public DbSet<Loan> Loans => Set<Loan>();
    public DbSet<LoanRequest> LoanRequests => Set<LoanRequest>();
    public DbSet<Movement> Movements => Set<Movement>();
    public async Task<IApplicationTransaction> BeginTransactionAsync() => new ApplicationTransaction(await Database.BeginTransactionAsync());
    protected override void OnModelCreating(ModelBuilder b)
    {
        b.Entity<User>().Property(x => x.SessionVersion).IsConcurrencyToken();
        b.Entity<User>().Property(x => x.MustChangePassword).HasDefaultValue(true);
        b.Entity<User>().ToTable(t => {
            t.HasCheckConstraint("CK_User_SessionVersion", "\"SessionVersion\" >= 0");
            t.HasCheckConstraint("CK_User_PasswordActivated", "\"MustChangePassword\" OR \"PasswordChangedAt\" IS NOT NULL");
            t.HasCheckConstraint("CK_User_Role", "\"Rol\" IN ('Administrador','ResponsableTecnologia','Colaborador')");
            t.HasCheckConstraint("CK_User_CanonicalEmail", "\"Correo\" = lower(btrim(\"Correo\")) AND length(\"Correo\") > 0");
            t.HasCheckConstraint("CK_User_RequiredNames", "length(btrim(\"Nombres\")) > 0 AND length(btrim(\"Apellidos\")) > 0 AND length(btrim(\"Area\")) > 0");
        });
        b.Entity<Equipment>().ToTable(t => {
            t.HasCheckConstraint("CK_Equipment_State", "\"Estado\" IN ('Disponible','Prestado','Mantenimiento','Baja')");
            t.HasCheckConstraint("CK_Equipment_RequiredData", "length(btrim(\"CodigoPatrimonial\")) > 0 AND \"CodigoPatrimonial\" = upper(btrim(\"CodigoPatrimonial\")) AND length(btrim(\"Nombre\")) > 0 AND length(btrim(\"Marca\")) > 0 AND length(btrim(\"Categoria\")) > 0");
        });
        b.Entity<Loan>().HasOne<User>().WithMany().HasForeignKey(x=>x.ResponsableId).OnDelete(DeleteBehavior.Restrict);
        b.Entity<Loan>().HasOne<User>().WithMany().HasForeignKey(x=>x.ResponsableDevolucionId).OnDelete(DeleteBehavior.Restrict);
        b.Entity<Loan>().Property(x=>x.Observacion).HasMaxLength(2000);
        b.Entity<Loan>().Property(x=>x.ObservacionDevolucion).HasMaxLength(2000);
        b.Entity<Loan>().Property(x=>x.AreaPrestamo).HasMaxLength(100);
        b.Entity<Loan>().ToTable(t=>t.HasCheckConstraint("CK_Loan_ReturnData", "(\"FechaDevolucion\" IS NULL AND \"ResponsableDevolucionId\" IS NULL AND \"ObservacionDevolucion\" IS NULL) OR (\"FechaDevolucion\" IS NOT NULL AND \"ResponsableDevolucionId\" IS NOT NULL AND length(btrim(coalesce(\"ObservacionDevolucion\",''))) > 0)"));
        b.Entity<LoanRequest>().HasOne<Loan>().WithMany().HasForeignKey(x=>x.PrestamoId).OnDelete(DeleteBehavior.Restrict);
        b.Entity<LoanRequest>().HasIndex(x=>x.PrestamoId).IsUnique().HasFilter("\"PrestamoId\" IS NOT NULL");
        b.Entity<LoanRequest>().Property(x=>x.Motivo).HasMaxLength(2000);
        b.Entity<LoanRequest>().Property(x=>x.Estado).HasMaxLength(30);
        b.Entity<LoanRequest>().ToTable(t=> {
            t.HasCheckConstraint("CK_Request_State", "\"Estado\" IN ('Pendiente','Aprobada','Rechazada')");
            t.HasCheckConstraint("CK_Request_Reason", "length(btrim(\"Motivo\")) > 0");
            t.HasCheckConstraint("CK_Request_Approval", "(\"Estado\" = 'Aprobada' AND \"PrestamoId\" IS NOT NULL) OR (\"Estado\" <> 'Aprobada' AND \"PrestamoId\" IS NULL)");
        });
        b.Entity<User>().HasIndex(x => x.Correo).IsUnique();
        b.Entity<Equipment>().HasIndex(x => x.CodigoPatrimonial).IsUnique();
        b.Entity<Equipment>().Property(x => x.Estado).IsConcurrencyToken();
        b.Entity<Loan>().Property(x => x.FechaDevolucion).IsConcurrencyToken();
        b.Entity<Loan>().HasIndex(x => x.EquipoId).IsUnique().HasFilter("\"FechaDevolucion\" IS NULL");
        b.Entity<Loan>().HasOne(x => x.Usuario).WithMany().HasForeignKey(x => x.UsuarioId).OnDelete(DeleteBehavior.Restrict);
        b.Entity<Loan>().HasOne(x => x.Equipo).WithMany().HasForeignKey(x => x.EquipoId).OnDelete(DeleteBehavior.Restrict);
        b.Entity<Loan>().ToTable(t => t.HasCheckConstraint("CK_Loan_Dates", "\"FechaDevolucion\" IS NULL OR \"FechaDevolucion\" > \"FechaPrestamo\""));
        b.Entity<LoanRequest>().Property(x => x.Estado).IsConcurrencyToken();
        b.Entity<LoanRequest>().HasOne(x => x.Usuario).WithMany().HasForeignKey(x => x.UsuarioId).OnDelete(DeleteBehavior.Restrict);
        b.Entity<LoanRequest>().HasOne(x => x.Equipo).WithMany().HasForeignKey(x => x.EquipoId).OnDelete(DeleteBehavior.Restrict);
        b.Entity<LoanRequest>().HasIndex(x => new { x.UsuarioId, x.EquipoId }).IsUnique().HasFilter("\"Estado\" = 'Pendiente'");
    }
    private void RecordMovements()
    {
        ChangeTracker.DetectChanges();
        var changes = ChangeTracker.Entries().Where(e => e.Entity is not Movement && e.State is EntityState.Added or EntityState.Modified or EntityState.Deleted).ToList();
        foreach (var e in changes)
        {
            var label = e.Entity switch { Equipment x => $"{x.CodigoPatrimonial}: {x.Nombre} - {x.Estado}", User x => $"{x.Nombres} {x.Apellidos} ({x.Correo}) - {(x.Estado ? "Activo" : "Inactivo")}", Loan x => $"{x.Equipo?.CodigoPatrimonial ?? "Equipo"} · {x.Equipo?.Nombre ?? "Asignación"}: {(x.FechaDevolucion == null ? "Préstamo registrado" : "Devolución registrada")}", LoanRequest x => $"Solicitud de {x.Usuario?.Nombres ?? "colaborador"}: {x.Equipo?.Nombre ?? "equipo"} · {x.Estado}", _ => "Actualización" };
            Movements.Add(new Movement { Entidad = e.Metadata.ClrType.Name, EntidadId = (Guid)e.Property("Id").CurrentValue!, Accion = e.State.ToString(), Detalle = label, Responsable = currentUser.Name });
        }
    }
    public override int SaveChanges() { RecordMovements(); return base.SaveChanges(); }
    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default) { RecordMovements(); return base.SaveChangesAsync(cancellationToken); }
}
