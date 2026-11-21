namespace TechAsset.Application.Interfaces;

public interface ICurrentUser
{
    Guid Id { get; }
    string Name { get; }
    bool IsStaff { get; }
}
