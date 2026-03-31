using FinanceDashboard.Api.Data;
using FinanceDashboard.Api.Models;
using FinanceDashboard.Api.Services.Auth;
using FinanceDashboard.Api.Services.CurrentUser;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Scalar.AspNetCore;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

builder.Configuration.AddJsonFile(
    "appsettings.Development.local.json",
    optional: true,
    reloadOnChange: true);

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(GetRequiredConnectionString(builder.Configuration)));

builder.Services.AddScoped<PasswordHasher>();
builder.Services.AddScoped<JwTokenService>();
builder.Services.AddScoped<CurrentUserService>();
builder.Services.AddScoped<IPasswordHasher<User>, PasswordHasher<User>>();
builder.Services.AddHttpContextAccessor();

var jwtKey = GetRequiredJwtKey(builder.Configuration);

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = builder.Configuration["Jwt:Issuer"],
        ValidAudience = builder.Configuration["Jwt:Audience"],
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey!))
    };
});

builder.Services.AddCors(options =>
{
    options.AddPolicy("frontend", policy =>
    {
        policy
            .WithOrigins("http://localhost:5173")
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

builder.Services.AddControllers();
builder.Services.AddAuthorization();
builder.Services.AddOpenApi();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.MapScalarApiReference(options =>
    {
        options.Title = "FinanceDashboard API";
        options.AddHttpAuthentication("Bearer", auth =>
        {
            auth.Token = string.Empty;
        });
    });
}

app.UseCors("frontend");
app.UseHttpsRedirection();
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();

static string GetRequiredConnectionString(IConfiguration configuration)
{
    var connectionString = configuration.GetConnectionString("Default");

    if (string.IsNullOrWhiteSpace(connectionString))
    {
        throw new InvalidOperationException(
            "ConnectionStrings:Default nao configurada. Defina a string de conexao em appsettings.Development.local.json ou na variavel ConnectionStrings__Default.");
    }

    return connectionString;
}

static string GetRequiredJwtKey(IConfiguration configuration)
{
    var jwtKey = configuration["Jwt:Key"];

    if (string.IsNullOrWhiteSpace(jwtKey))
    {
        throw new InvalidOperationException(
            "Jwt:Key nao configurada. Defina a chave em appsettings.Development.local.json ou na variavel Jwt__Key.");
    }

    return jwtKey;
}
