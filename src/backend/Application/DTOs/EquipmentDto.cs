using System;

namespace TechAsset.Application.DTOs
{
    public class EquipmentDto
    {
        public Guid Id { get; set; }
        public string CodigoPatrimonial { get; set; } = "";
        public string Nombre { get; set; } = "";
        public string Categoria { get; set; } = "";
        public string Marca { get; set; } = "";
        public string Estado { get; set; } = "";
    }
}
