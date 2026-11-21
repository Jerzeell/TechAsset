using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using TechAsset.Application.DTOs;

namespace TechAsset.Application.Interfaces
{
    public interface ILoanService
    {
        Task<LoanDto> CreateLoanAsync(CreateLoanDto dto);
        Task<LoanDto> RegisterReturnAsync(Guid loanId, RegisterReturnDto dto);
        Task<IEnumerable<LoanDto>> GetActiveLoansAsync();
        Task<IEnumerable<LoanDto>> GetLoanHistoryAsync();
        Task<IEnumerable<LoanDto>> GetLoansByUserAsync(Guid userId);
        Task<IEnumerable<LoanDto>> GetLoansByEquipmentAsync(Guid equipmentId);
    }
}
