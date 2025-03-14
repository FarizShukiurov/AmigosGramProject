using AmigosGramProject.Server.Models;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using Azure.Storage.Blobs;
using AmigosGramProject.Server.Hubs;
using AmigosGramProject.Server.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;

namespace AmigosGramProject.Server
{
    public class Program
    {
        public static void Main(string[] args)
        {
            var builder = WebApplication.CreateBuilder(args);

            // ����������� � ���� ������
            var connectionString = builder.Configuration.GetConnectionString("DefaultConnection") ?? throw new InvalidOperationException();
            builder.Services.AddDbContext<ChatDbContext>(options => options.UseSqlServer(connectionString));

            // ��������� CORS
            builder.Services.AddCors(options =>
            {

                options.AddDefaultPolicy(policy =>
                {
                    policy.WithOrigins("https://localhost:5173")
                        .AllowAnyHeader()
                        .AllowAnyMethod()
                        .AllowCredentials();
                });
            });

            // SignalR
            builder.Services.AddSignalR();

            // Email ������
            builder.Services.AddScoped<IEmailSender, EmailSender>();

            // JWT Token Helper
            builder.Services.AddScoped<JwtTokenHelper>();
            builder.Services.AddScoped<PasswordHasher>();  // ���������, ��� ����� ���������� ���

            // Azure Blob Storage
            builder.Services.AddSingleton(x =>
                new BlobServiceClient(builder.Configuration.GetSection("Azure:BlobStorage:ConnectionString").Value));

            // Controllers
            builder.Services.AddControllers();
            builder.Services.AddEndpointsApiExplorer();
            builder.Services.AddSwaggerGen();
            builder.Services.AddHttpClient();

            // �����������
            builder.Logging.ClearProviders();
            builder.Logging.AddConsole();
            builder.Logging.SetMinimumLevel(LogLevel.Trace);

            // �������������� ����� JWT
            var secretKey = builder.Configuration.GetValue<string>("JwtSettings:Secret");
            if (string.IsNullOrEmpty(secretKey))
            {
                throw new InvalidOperationException("SecretKey ��� JWT �� ������ � ������������.");
            }

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
                    ValidIssuer = builder.Configuration["JwtSettings:Issuer"],
                    ValidAudience = builder.Configuration["JwtSettings:Audience"],
                    IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(builder.Configuration["JwtSettings:Secret"]))
                };

                options.Events = new JwtBearerEvents
                {
                    OnMessageReceived = context =>
                    {
                        var accessToken = context.HttpContext.Request.Cookies["accessToken"];
                        if (!string.IsNullOrEmpty(accessToken))
                        {
                            context.Token = accessToken;
                            Console.WriteLine($"Token received: {accessToken}"); 
                        }
                        else
                        {
                            Console.WriteLine("No token found in cookies.");
                        }

                        return Task.CompletedTask;
                    }
                };
            });




            var app = builder.Build();

            // Middleware
            app.UseDefaultFiles();
            app.UseStaticFiles();
            app.UseCors();
            app.UseHttpsRedirection();
            app.UseAuthentication();
            app.UseAuthorization();

            // Swagger
            if (app.Environment.IsDevelopment())
            {
                app.UseSwagger();
                app.UseSwaggerUI();
            }

            // �������� ��� ������
            app.MapPost("/logout", async (HttpContext httpContext) =>
            {
                // ����� ����� ����������� ������ ��� "������" �� �������, ��������, �������� ������
                return Results.Ok(new { Message = "Logged out successfully" });
            }).RequireAuthorization();  // ��������� ����������� ��� ������

            // �������� ��� �������� ��������������
            app.MapGet("/pingauth", (HttpContext httpContext) =>
            {
                // �������� ������� email claim
                var emailClaim = httpContext.User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.Email)?.Value;

                if (emailClaim != null)
                {
                    return Results.Json(new { Email = emailClaim });  // ���������� email, ���� �� ���� � ������
                }

                return Results.Unauthorized();  // ���� email �� ������ ��� ������������ �� ����������������
            }).RequireAuthorization();  // ��������� ����������� ��� ���������� �������

            // ���������
            app.MapHub<ChatHub>("/chat");
            app.MapControllers();
            app.MapFallbackToFile("index.html");

            app.Run();
        }
    }
}
