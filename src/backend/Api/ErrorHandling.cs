using TechAsset.Application.Exceptions;
using Microsoft.EntityFrameworkCore;
using Npgsql;
using System.ComponentModel.DataAnnotations;
namespace TechAsset.Api;

public class ErrorHandling(RequestDelegate next, ILogger<ErrorHandling> logger)
{
    public async Task InvokeAsync(HttpContext context)
    {
        try { await next(context); }
        catch (Exception ex) when (!context.Response.HasStarted)
        {
            var (status, message) = ex switch
            {
                ValidationException => (400, ex.Message),
                BusinessRuleException => (400, ex.Message),
                ArgumentException => (400, ex.Message),
                KeyNotFoundException => (404, ex.Message),
                DbUpdateConcurrencyException => (409, "El registro cambió durante la operación. Actualice la información e intente de nuevo."),
                DbUpdateException { InnerException: PostgresException { SqlState: "23505" } } => (409, "Ya existe un correo, código patrimonial, préstamo activo o solicitud pendiente con esos datos."),
                DbUpdateException { InnerException: PostgresException { SqlState: "23503" } } => (409, "El registro está asociado a un historial y no puede eliminarse."),
                _ => (500, "Ocurrió un error interno. Intente nuevamente.")
            };
            if (status == 500) logger.LogError(ex, "Error al procesar {Path}", context.Request.Path);
            context.Response.StatusCode = status; await context.Response.WriteAsJsonAsync(new { message });
        }
    }
}
