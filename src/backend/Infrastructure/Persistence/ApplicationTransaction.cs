using Microsoft.EntityFrameworkCore.Storage;
using TechAsset.Application.Interfaces;
namespace TechAsset.Infrastructure.Persistence;
internal sealed class ApplicationTransaction(IDbContextTransaction transaction) : IApplicationTransaction {
 public Task CommitAsync() => transaction.CommitAsync();
 public ValueTask DisposeAsync() => transaction.DisposeAsync();
}
