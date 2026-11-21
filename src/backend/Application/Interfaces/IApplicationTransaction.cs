namespace TechAsset.Application.Interfaces;
public interface IApplicationTransaction : IAsyncDisposable { Task CommitAsync(); }
