using TechAsset.Application.DTOs;
namespace TechAsset.Application.Interfaces;
public interface IRequestService {
 Task<IReadOnlyList<RequestDto>> ListAsync();
 Task<RequestDto> CreateAsync(CreateRequestDto input);
 Task<LoanDto> ApproveAsync(Guid id);
 Task RejectAsync(Guid id);
}
