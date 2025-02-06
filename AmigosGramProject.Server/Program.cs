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

            // Подключение к базе данных
            var connectionString = builder.Configuration.GetConnectionString("DefaultConnection") ?? throw new InvalidOperationException();
            builder.Services.AddDbContext<ChatDbContext>(options => options.UseSqlServer(connectionString));

            // Настройка CORS
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

            // Email сервис
            builder.Services.AddScoped<IEmailSender, EmailSender>();

            // JWT Token Helper
            builder.Services.AddScoped<JwtTokenHelper>();
            builder.Services.AddScoped<PasswordHasher>();  // Убедитесь, что здесь правильный тип

            // Azure Blob Storage
            builder.Services.AddSingleton(x =>
                new BlobServiceClient(builder.Configuration.GetSection("Azure:BlobStorage:ConnectionString").Value));

            // Controllers
            builder.Services.AddControllers();
            builder.Services.AddEndpointsApiExplorer();
            builder.Services.AddSwaggerGen();
            builder.Services.AddHttpClient();

            // Логирование
            builder.Logging.ClearProviders();
            builder.Logging.AddConsole();
            builder.Logging.SetMinimumLevel(LogLevel.Trace);

            // Аутентификация через JWT
            var secretKey = builder.Configuration.GetValue<string>("JwtSettings:Secret");
            if (string.IsNullOrEmpty(secretKey))
            {
                throw new InvalidOperationException("SecretKey для JWT не найден в конфигурации.");
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

            // Эндпоинт для выхода
            app.MapPost("/logout", async (HttpContext httpContext) =>
            {
                // Здесь можно реализовать логику для "выхода" на клиенте, например, удаление токена
                return Results.Ok(new { Message = "Logged out successfully" });
            }).RequireAuthorization();  // Требуется авторизация для выхода

            // Эндпоинт для проверки аутентификации
            app.MapGet("/pingauth", (HttpContext httpContext) =>
            {
                // Проверка наличия email claim
                var emailClaim = httpContext.User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.Email)?.Value;

                if (emailClaim != null)
                {
                    return Results.Json(new { Email = emailClaim });  // Возвращаем email, если он есть в токене
                }

                return Results.Unauthorized();  // Если email не найден или пользователь не аутентифицирован
            }).RequireAuthorization();  // Требуется авторизация для выполнения запроса

            // Эндпоинты
            app.MapHub<ChatHub>("/chat");
            app.MapControllers();
            app.MapFallbackToFile("index.html");

            app.Run();
        }
    }
}
