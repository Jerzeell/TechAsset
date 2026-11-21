using Microsoft.AspNetCore.Authentication.JwtBearer;
using TechAsset.Api;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using System.Security.Claims;
using System.Text;
using TechAsset.Application.Interfaces;
using TechAsset.Application.Services;
using TechAsset.Domain.Entities;
using TechAsset.Infrastructure.Persistence;

var builder = WebApplication.CreateBuilder(args);

// Connection String Configuration
var connectionString = builder.Configuration.GetConnectionString("Default")
                       ?? builder.Configuration["ConnectionStrings:Default"]
                       ?? throw new InvalidOperationException("Configure ConnectionStrings__Default antes de iniciar.");

builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<ICurrentUser, CurrentUser>();

// Register DbContext
builder.Services.AddDbContext<TechAssetDbContext>(options =>
    options.UseNpgsql(connectionString));

// Register Application DbContext Interface mapping
builder.Services.AddScoped<IApplicationDbContext>(provider =>
    provider.GetRequiredService<TechAssetDbContext>());

// Register Application Services
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddScoped<IEquipmentService, EquipmentService>();
builder.Services.AddScoped<ILoanService, LoanService>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IRequestService, RequestService>();
builder.Services.AddScoped<IReportService, ReportService>();

// Add Controllers
builder.Services.AddControllers();

// Configure CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.WithOrigins("http://localhost:3000", "http://127.0.0.1:3000")
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

// Configure JWT Authentication
var jwtKeyString = builder.Configuration["Jwt:Key"] ?? throw new InvalidOperationException("Configure Jwt__Key antes de iniciar.");
if (jwtKeyString.Length < 32)
{
    throw new InvalidOperationException("Jwt__Key debe tener al menos 32 caracteres.");
}
var key = Encoding.UTF8.GetBytes(jwtKeyString);
var issuer = builder.Configuration["Jwt:Issuer"] ?? "TechAssetIssuer";

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.Events = new JwtBearerEvents
    {
        OnTokenValidated = async ctx =>
        {
            var db = ctx.HttpContext.RequestServices.GetRequiredService<TechAssetDbContext>();
            var id = ctx.Principal?.FindFirstValue(ClaimTypes.NameIdentifier);
            var role = ctx.Principal?.FindFirstValue(ClaimTypes.Role);
            var version = ctx.Principal?.FindFirstValue("session_version");
            var required = ctx.Principal?.FindFirstValue("password_change_required") == "true";
            if (!int.TryParse(version, out var tokenVersion) || !Guid.TryParse(id, out var userId) || !await db.Users.AnyAsync(u => u.Id == userId && u.Estado && u.Rol == role && u.SessionVersion == tokenVersion && u.MustChangePassword == required)) ctx.Fail("La sesión ya no está habilitada.");
        }
    };
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = issuer,
        ValidAudience = issuer,
        IssuerSigningKey = new SymmetricSecurityKey(key),
        NameClaimType = ClaimTypes.Name,
        RoleClaimType = ClaimTypes.Role
    };
});

// Authorization Policies
builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("AdminOnly", policy => policy.RequireRole("Administrador"));
    options.AddPolicy("TechOrAdmin", policy => policy.RequireRole("Administrador", "ResponsableTecnologia"));
    options.AddPolicy("AuthorizedUser", policy => policy.RequireAuthenticatedUser());
});

// Swagger / OpenAPI Setup with JWT security definition
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "TechAsset API", Version = "v1" });

    // Add Security Definition for JWT Bearer Token
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using the Bearer scheme. Example: \"Bearer {token}\"",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

var app = builder.Build();
app.UseMiddleware<ErrorHandling>();

// Enable CORS
app.UseCors("AllowAll");

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment()) // Enable Swagger in production/docker as well for easy verification
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "TechAsset API v1");
        c.RoutePrefix = "swagger"; // Available at /swagger
    });
}



app.UseAuthentication();
app.Use(async (ctx, next) => {
    if (ctx.User.Identity?.IsAuthenticated == true && ctx.User.FindFirstValue("password_change_required") == "true"
        && ctx.Request.Path.StartsWithSegments("/api")
        && ctx.Request.Path != "/api/auth/change-password" && ctx.Request.Path != "/api/auth/login"
        && ctx.Request.Path != "/api/auth/support-contacts" && ctx.Request.Path != "/api/health")
    {
        ctx.Response.StatusCode = 403;
        await ctx.Response.WriteAsJsonAsync(new { code = "PASSWORD_CHANGE_REQUIRED", message = "Antes de continuar debes cambiar tu contraseña temporal." });
        return;
    }
    await next();
});
app.UseAuthorization();

app.MapControllers();
app.MapGet("/api/health", async (TechAssetDbContext db) => await db.Database.CanConnectAsync() ? Results.Ok(new { status = "ok" }) : Results.StatusCode(503));

// Database Seeding & Initialization
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    try
    {
        var context = services.GetRequiredService<TechAssetDbContext>();

        // Auto-create database schema if it doesn't exist
        context.Database.Migrate();

        // Seed Default Users
        if (!context.Users.Any())
        {
            context.Users.AddRange(
                new User
                {
                    Id = Guid.NewGuid(),
                    Nombres = "Juan",
                    Apellidos = "Pérez Admin",
                    Correo = "admin@techasset.com",
                    Area = "Sistemas",
                    PasswordHash = UserService.HashPassword(InitialPassword("Seed:AdminPassword")),
                    Rol = "Administrador",
                    Estado = true
                },
                new User
                {
                    Id = Guid.NewGuid(),
                    Nombres = "María",
                    Apellidos = "Sánchez Soporte",
                    Correo = "tech@techasset.com",
                    Area = "Tecnología de Información",
                    PasswordHash = UserService.HashPassword(InitialPassword("Seed:TechPassword")),
                    Rol = "ResponsableTecnologia",
                    Estado = true
                },
                new User
                {
                    Id = Guid.NewGuid(),
                    Nombres = "Carlos",
                    Apellidos = "Gómez Colaborador",
                    Correo = "colab@techasset.com",
                    Area = "Marketing",
                    PasswordHash = UserService.HashPassword(InitialPassword("Seed:ColabPassword")),
                    Rol = "Colaborador",
                    Estado = true
                }
            );
            context.SaveChanges();
        }

        // Seed Default Equipments
        if (!context.Equipments.Any())
        {
            context.Equipments.AddRange(
                new Equipment
                {
                    Id = Guid.NewGuid(),
                    CodigoPatrimonial = "PAT-001",
                    Nombre = "Laptop Dell Latitude 3420",
                    Categoria = "Laptops",
                    Marca = "Dell",
                    Estado = "Disponible"
                },
                new Equipment
                {
                    Id = Guid.NewGuid(),
                    CodigoPatrimonial = "PAT-002",
                    Nombre = "Computadora Desktop HP Pro",
                    Categoria = "Computadoras de escritorio",
                    Marca = "HP",
                    Estado = "Disponible"
                },
                new Equipment
                {
                    Id = Guid.NewGuid(),
                    CodigoPatrimonial = "PAT-003",
                    Nombre = "Monitor LG 27 pulgadas IPS",
                    Categoria = "Monitores",
                    Marca = "LG",
                    Estado = "Disponible"
                },
                new Equipment
                {
                    Id = Guid.NewGuid(),
                    CodigoPatrimonial = "PAT-004",
                    Nombre = "Impresora Epson EcoTank",
                    Categoria = "Impresoras",
                    Marca = "Epson",
                    Estado = "Mantenimiento"
                },
                new Equipment
                {
                    Id = Guid.NewGuid(),
                    CodigoPatrimonial = "PAT-005",
                    Nombre = "Tablet Samsung Galaxy Tab",
                    Categoria = "Tablets",
                    Marca = "Samsung",
                    Estado = "Disponible"
                },
                new Equipment
                {
                    Id = Guid.NewGuid(),
                    CodigoPatrimonial = "PAT-006",
                    Nombre = "Proyector Multimedia Epson",
                    Categoria = "Proyectores multimedia",
                    Marca = "Epson",
                    Estado = "Baja"
                }
            );
            context.SaveChanges();
        }
    }
    catch (Exception ex)
    {
        var logger = services.GetRequiredService<ILogger<Program>>();
        logger.LogError(ex, "Ocurrió un error al migrar o sembrar la base de datos.");
        throw;
    }
}

app.Run();

string InitialPassword(string setting)
{
    var password = builder.Configuration[setting]
        ?? throw new InvalidOperationException($"Configure {setting} para inicializar una base nueva.");
    PasswordPolicy.Validate(password);
    return password;
}
