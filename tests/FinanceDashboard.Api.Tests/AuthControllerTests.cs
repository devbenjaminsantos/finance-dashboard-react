using FinanceDashboard.Api.Controllers;
using FinanceDashboard.Api.Data;
using FinanceDashboard.Api.DTOs;
using FinanceDashboard.Api.Models;
using FinanceDashboard.Api.Services.Auth;
using FinanceDashboard.Api.Services.Email;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.FileProviders;
using Microsoft.Extensions.Logging.Abstractions;
using Xunit;

namespace FinanceDashboard.Api.Tests;

public class AuthControllerTests
{
    [Fact]
    public async Task Register_ReturnsConflict_WhenEmailAlreadyExists()
    {
        using var context = CreateContext();
        var controller = CreateController(context);

        context.Users.Add(new User
        {
            Name = "Ja Existe",
            Email = "user@finova.app",
            EmailConfirmed = true,
            PasswordHash = HashPassword("SenhaSegura123!")
        });
        await context.SaveChangesAsync();

        var result = await controller.Register(new RegisterRequest
        {
            Name = "Novo Usuario",
            Email = "USER@finova.app",
            Password = "SenhaSegura123!"
        });

        var conflict = Assert.IsType<ConflictObjectResult>(result.Result);
        var problem = Assert.IsType<ProblemDetails>(conflict.Value);

        Assert.Equal(StatusCodes.Status409Conflict, conflict.StatusCode);
        Assert.Equal("E-mail ja cadastrado.", problem.Title);
    }

    [Fact]
    public async Task Register_CreatesUnconfirmedUser_AndVerificationToken()
    {
        using var context = CreateContext();
        var emailSender = new FakeEmailSender();
        var controller = CreateController(context, emailSender: emailSender);

        var result = await controller.Register(new RegisterRequest
        {
            Name = "Novo Usuario",
            Email = "novo@finova.app",
            Password = "SenhaSegura123!"
        });

        var created = Assert.IsType<ObjectResult>(result.Result);
        var payload = Assert.IsType<AuthUserResponse>(created.Value);
        var user = await context.Users.SingleAsync();

        Assert.Equal(StatusCodes.Status201Created, created.StatusCode);
        Assert.Equal("novo@finova.app", user.Email);
        Assert.False(user.EmailConfirmed);
        Assert.Single(context.EmailVerificationTokens);
        Assert.NotNull(emailSender.LastVerificationUrl);
        Assert.Equal(payload.Email, user.Email);
    }

    [Fact]
    public async Task Login_ReturnsForbidden_WhenEmailIsNotConfirmed()
    {
        using var context = CreateContext();
        var controller = CreateController(context);

        var user = new User
        {
            Name = "Finova User",
            Email = "user@finova.app",
            EmailConfirmed = false,
        };
        user.PasswordHash = HashPassword("SenhaSegura123!", user);

        context.Users.Add(user);
        await context.SaveChangesAsync();

        var result = await controller.Login(new LoginRequest
        {
            Email = user.Email,
            Password = "SenhaSegura123!"
        });

        var forbidden = Assert.IsType<ObjectResult>(result.Result);
        var problem = Assert.IsType<ProblemDetails>(forbidden.Value);

        Assert.Equal(StatusCodes.Status403Forbidden, forbidden.StatusCode);
        Assert.Equal("Confirme seu e-mail antes de entrar.", problem.Title);
    }

    [Fact]
    public async Task Login_ReturnsToken_WhenCredentialsAreValid_AndEmailIsConfirmed()
    {
        using var context = CreateContext();
        var controller = CreateController(context);

        var user = new User
        {
            Name = "Finova User",
            Email = "user@finova.app",
            EmailConfirmed = true,
        };
        user.PasswordHash = HashPassword("SenhaSegura123!", user);

        context.Users.Add(user);
        await context.SaveChangesAsync();

        var result = await controller.Login(new LoginRequest
        {
            Email = user.Email,
            Password = "SenhaSegura123!"
        });

        var ok = Assert.IsType<OkObjectResult>(result.Result);
        var payload = Assert.IsType<AuthResponse>(ok.Value);

        Assert.False(string.IsNullOrWhiteSpace(payload.Token));
        Assert.Equal(user.Email, payload.User.Email);
    }

    [Fact]
    public async Task VerifyEmail_ConfirmsUser_AndMarksTokenAsUsed()
    {
        using var context = CreateContext();
        var emailSender = new FakeEmailSender();
        var controller = CreateController(context, emailSender: emailSender);

        await controller.Register(new RegisterRequest
        {
            Name = "Novo Usuario",
            Email = "novo@finova.app",
            Password = "SenhaSegura123!"
        });

        var token = ExtractTokenFromUrl(emailSender.LastVerificationUrl);

        var result = await controller.VerifyEmail(new VerifyEmailRequest
        {
            Token = token
        });

        var ok = Assert.IsType<OkObjectResult>(result);
        var user = await context.Users.SingleAsync();
        var verificationToken = await context.EmailVerificationTokens.SingleAsync();

        Assert.True(user.EmailConfirmed);
        Assert.NotNull(verificationToken.UsedAtUtc);
        Assert.NotNull(ok.Value);
    }

    [Fact]
    public async Task ForgotPassword_PersistsResetToken_AndReturnsUrl_WhenExposureIsEnabled()
    {
        using var context = CreateContext();
        var emailSender = new FakeEmailSender();
        var controller = CreateController(
            context,
            emailSender: emailSender,
            configurationValues: new Dictionary<string, string?>
            {
                ["Client:BaseUrl"] = "https://finova.example",
                ["PasswordReset:ExposeResetUrlInResponse"] = "true"
            });

        var user = new User
        {
            Name = "Finova User",
            Email = "user@finova.app",
            EmailConfirmed = true,
        };
        user.PasswordHash = HashPassword("SenhaSegura123!", user);
        context.Users.Add(user);
        await context.SaveChangesAsync();

        var result = await controller.ForgotPassword(new ForgotPasswordRequest
        {
            Email = user.Email
        });

        var ok = Assert.IsType<OkObjectResult>(result.Result);
        var payload = Assert.IsType<ForgotPasswordResponse>(ok.Value);
        var token = ExtractTokenFromUrl(payload.ResetUrl);

        Assert.NotNull(payload.ResetUrl);
        Assert.Contains("reset-password?token=", payload.ResetUrl);
        Assert.Single(context.PasswordResetTokens);
        Assert.Equal(payload.ResetUrl, emailSender.LastResetUrl);
        Assert.False(string.IsNullOrWhiteSpace(token));
    }

    [Fact]
    public async Task ResetPassword_UpdatesPassword_AndMarksTokenAsUsed()
    {
        using var context = CreateContext();
        var controller = CreateController(
            context,
            configurationValues: new Dictionary<string, string?>
            {
                ["Client:BaseUrl"] = "https://finova.example",
                ["PasswordReset:ExposeResetUrlInResponse"] = "true"
            });

        var user = new User
        {
            Name = "Finova User",
            Email = "user@finova.app",
            EmailConfirmed = true,
        };
        user.PasswordHash = HashPassword("SenhaSegura123!", user);
        context.Users.Add(user);
        await context.SaveChangesAsync();

        var forgot = await controller.ForgotPassword(new ForgotPasswordRequest
        {
            Email = user.Email
        });

        var forgotOk = Assert.IsType<OkObjectResult>(forgot.Result);
        var forgotPayload = Assert.IsType<ForgotPasswordResponse>(forgotOk.Value);
        var rawToken = ExtractTokenFromUrl(forgotPayload.ResetUrl);

        var resetResult = await controller.ResetPassword(new ResetPasswordRequest
        {
            Token = rawToken,
            NewPassword = "NovaSenha456!"
        });

        var ok = Assert.IsType<OkObjectResult>(resetResult);
        var tokenEntity = await context.PasswordResetTokens.SingleAsync();
        var refreshedUser = await context.Users.SingleAsync();

        Assert.NotNull(tokenEntity.UsedAtUtc);
        Assert.True(CreatePasswordHasher().VerifyPassword(refreshedUser, "NovaSenha456!"));
        Assert.False(CreatePasswordHasher().VerifyPassword(refreshedUser, "SenhaSegura123!"));
        Assert.NotNull(ok.Value);
    }

    private static AppDbContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        return new AppDbContext(options);
    }

    private static AuthController CreateController(
        AppDbContext context,
        FakeEmailSender? emailSender = null,
        Dictionary<string, string?>? configurationValues = null)
    {
        var configData = new Dictionary<string, string?>
        {
            ["Jwt:Key"] = "FinovaJwtKey2026-Segura-Com-32-Bytes!",
            ["Jwt:Issuer"] = "FinanceDashboard",
            ["Jwt:Audience"] = "FinanceDashboard",
            ["Client:BaseUrl"] = "https://finova.example"
        };

        if (configurationValues is not null)
        {
            foreach (var item in configurationValues)
            {
                configData[item.Key] = item.Value;
            }
        }

        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(configData)
            .Build();

        var controller = new AuthController(
            context,
            CreatePasswordHasher(),
            new JwTokenService(configuration),
            new PasswordResetTokenService(),
            emailSender ?? new FakeEmailSender(),
            configuration,
            new FakeWebHostEnvironment(),
            NullLogger<AuthController>.Instance);

        controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext()
        };

        return controller;
    }

    private static PasswordHasher CreatePasswordHasher()
    {
        return new PasswordHasher(new Microsoft.AspNetCore.Identity.PasswordHasher<User>());
    }

    private static string HashPassword(string password, User? user = null)
    {
        var entity = user ?? new User { Email = "seed@finova.app", Name = "Seed", EmailConfirmed = true };
        return CreatePasswordHasher().HashPassword(entity, password);
    }

    private static string ExtractTokenFromUrl(string? url)
    {
        Assert.False(string.IsNullOrWhiteSpace(url));

        const string tokenKey = "token=";
        var index = url!.IndexOf(tokenKey, StringComparison.Ordinal);

        Assert.True(index >= 0, "URL should contain token query parameter.");

        return Uri.UnescapeDataString(url[(index + tokenKey.Length)..]);
    }

    private sealed class FakeEmailSender : IEmailSender
    {
        public string? LastResetUrl { get; private set; }
        public string? LastVerificationUrl { get; private set; }

        public Task SendPasswordResetEmailAsync(string toEmail, string name, string resetUrl)
        {
            LastResetUrl = resetUrl;
            return Task.CompletedTask;
        }

        public Task SendEmailVerificationAsync(string toEmail, string name, string verificationUrl)
        {
            LastVerificationUrl = verificationUrl;
            return Task.CompletedTask;
        }
    }

    private sealed class FakeWebHostEnvironment : IWebHostEnvironment
    {
        public string EnvironmentName { get; set; } = "Development";
        public string ApplicationName { get; set; } = "FinanceDashboard.Api.Tests";
        public string WebRootPath { get; set; } = string.Empty;
        public IFileProvider WebRootFileProvider { get; set; } = null!;
        public string ContentRootPath { get; set; } = string.Empty;
        public IFileProvider ContentRootFileProvider { get; set; } = null!;
    }
}
