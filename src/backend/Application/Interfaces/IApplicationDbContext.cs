using Microsoft.EntityFrameworkCore;
using System.Threading;
using System.Threading.Tasks;
using TechAsset.Domain.Entities;

namespace TechAsset.Application.Interfaces
{
    public interface IApplicationDbContext
    {
        DbSet<User> Users { get; }
        DbSet<Equipment> Equipments { get; }
        DbSet<Loan> Loans { get; }
        DbSet<LoanRequest> LoanRequests { get; }
        DbSet<Movement> Movements { get; }
        Task<IApplicationTransaction> BeginTransactionAsync();
        Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
    }
}
