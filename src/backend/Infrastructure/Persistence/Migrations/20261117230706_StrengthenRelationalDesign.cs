using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TechAsset.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class StrengthenRelationalDesign : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<string>(
                name: "ObservacionDevolucion",
                table: "Loans",
                type: "character varying(2000)",
                maxLength: 2000,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "text",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "Observacion",
                table: "Loans",
                type: "character varying(2000)",
                maxLength: 2000,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "text",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "AreaPrestamo",
                table: "Loans",
                type: "character varying(100)",
                maxLength: 100,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "text");

            migrationBuilder.AlterColumn<string>(
                name: "Motivo",
                table: "LoanRequests",
                type: "character varying(2000)",
                maxLength: 2000,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "text");

            migrationBuilder.AlterColumn<string>(
                name: "Estado",
                table: "LoanRequests",
                type: "character varying(30)",
                maxLength: 30,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "text");

            migrationBuilder.AddCheckConstraint(
                name: "CK_User_CanonicalEmail",
                table: "Users",
                sql: "\"Correo\" = lower(btrim(\"Correo\")) AND length(\"Correo\") > 0");

            migrationBuilder.AddCheckConstraint(
                name: "CK_User_RequiredNames",
                table: "Users",
                sql: "length(btrim(\"Nombres\")) > 0 AND length(btrim(\"Apellidos\")) > 0 AND length(btrim(\"Area\")) > 0");

            migrationBuilder.AddCheckConstraint(
                name: "CK_User_Role",
                table: "Users",
                sql: "\"Rol\" IN ('Administrador','ResponsableTecnologia','Colaborador')");

            migrationBuilder.CreateIndex(
                name: "IX_Loans_ResponsableDevolucionId",
                table: "Loans",
                column: "ResponsableDevolucionId");

            migrationBuilder.CreateIndex(
                name: "IX_Loans_ResponsableId",
                table: "Loans",
                column: "ResponsableId");

            migrationBuilder.AddCheckConstraint(
                name: "CK_Loan_ReturnData",
                table: "Loans",
                sql: "(\"FechaDevolucion\" IS NULL AND \"ResponsableDevolucionId\" IS NULL AND \"ObservacionDevolucion\" IS NULL) OR (\"FechaDevolucion\" IS NOT NULL AND \"ResponsableDevolucionId\" IS NOT NULL AND length(btrim(coalesce(\"ObservacionDevolucion\",''))) > 0)");

            migrationBuilder.CreateIndex(
                name: "IX_LoanRequests_PrestamoId",
                table: "LoanRequests",
                column: "PrestamoId",
                unique: true,
                filter: "\"PrestamoId\" IS NOT NULL");

            migrationBuilder.AddCheckConstraint(
                name: "CK_Request_Approval",
                table: "LoanRequests",
                sql: "(\"Estado\" = 'Aprobada' AND \"PrestamoId\" IS NOT NULL) OR (\"Estado\" <> 'Aprobada' AND \"PrestamoId\" IS NULL)");

            migrationBuilder.AddCheckConstraint(
                name: "CK_Request_Reason",
                table: "LoanRequests",
                sql: "length(btrim(\"Motivo\")) > 0");

            migrationBuilder.AddCheckConstraint(
                name: "CK_Request_State",
                table: "LoanRequests",
                sql: "\"Estado\" IN ('Pendiente','Aprobada','Rechazada')");

            migrationBuilder.AddCheckConstraint(
                name: "CK_Equipment_RequiredData",
                table: "Equipments",
                sql: "length(btrim(\"CodigoPatrimonial\")) > 0 AND \"CodigoPatrimonial\" = upper(btrim(\"CodigoPatrimonial\")) AND length(btrim(\"Nombre\")) > 0 AND length(btrim(\"Marca\")) > 0 AND length(btrim(\"Categoria\")) > 0");

            migrationBuilder.AddCheckConstraint(
                name: "CK_Equipment_State",
                table: "Equipments",
                sql: "\"Estado\" IN ('Disponible','Prestado','Mantenimiento','Baja')");

            migrationBuilder.AddForeignKey(
                name: "FK_LoanRequests_Loans_PrestamoId",
                table: "LoanRequests",
                column: "PrestamoId",
                principalTable: "Loans",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Loans_Users_ResponsableDevolucionId",
                table: "Loans",
                column: "ResponsableDevolucionId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Loans_Users_ResponsableId",
                table: "Loans",
                column: "ResponsableId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_LoanRequests_Loans_PrestamoId",
                table: "LoanRequests");

            migrationBuilder.DropForeignKey(
                name: "FK_Loans_Users_ResponsableDevolucionId",
                table: "Loans");

            migrationBuilder.DropForeignKey(
                name: "FK_Loans_Users_ResponsableId",
                table: "Loans");

            migrationBuilder.DropCheckConstraint(
                name: "CK_User_CanonicalEmail",
                table: "Users");

            migrationBuilder.DropCheckConstraint(
                name: "CK_User_RequiredNames",
                table: "Users");

            migrationBuilder.DropCheckConstraint(
                name: "CK_User_Role",
                table: "Users");

            migrationBuilder.DropIndex(
                name: "IX_Loans_ResponsableDevolucionId",
                table: "Loans");

            migrationBuilder.DropIndex(
                name: "IX_Loans_ResponsableId",
                table: "Loans");

            migrationBuilder.DropCheckConstraint(
                name: "CK_Loan_ReturnData",
                table: "Loans");

            migrationBuilder.DropIndex(
                name: "IX_LoanRequests_PrestamoId",
                table: "LoanRequests");

            migrationBuilder.DropCheckConstraint(
                name: "CK_Request_Approval",
                table: "LoanRequests");

            migrationBuilder.DropCheckConstraint(
                name: "CK_Request_Reason",
                table: "LoanRequests");

            migrationBuilder.DropCheckConstraint(
                name: "CK_Request_State",
                table: "LoanRequests");

            migrationBuilder.DropCheckConstraint(
                name: "CK_Equipment_RequiredData",
                table: "Equipments");

            migrationBuilder.DropCheckConstraint(
                name: "CK_Equipment_State",
                table: "Equipments");

            migrationBuilder.AlterColumn<string>(
                name: "ObservacionDevolucion",
                table: "Loans",
                type: "text",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "character varying(2000)",
                oldMaxLength: 2000,
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "Observacion",
                table: "Loans",
                type: "text",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "character varying(2000)",
                oldMaxLength: 2000,
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "AreaPrestamo",
                table: "Loans",
                type: "text",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(100)",
                oldMaxLength: 100);

            migrationBuilder.AlterColumn<string>(
                name: "Motivo",
                table: "LoanRequests",
                type: "text",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(2000)",
                oldMaxLength: 2000);

            migrationBuilder.AlterColumn<string>(
                name: "Estado",
                table: "LoanRequests",
                type: "text",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(30)",
                oldMaxLength: 30);
        }
    }
}
