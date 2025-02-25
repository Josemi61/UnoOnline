using Memory.Service;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.FileProviders;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using Swashbuckle.AspNetCore.Filters;
using System.Security.Claims;
using System.Text;
using UnoOnline.Data;
using UnoOnline.DataMappers;
using UnoOnline.Interfaces;
using UnoOnline.Middleware;
using UnoOnline.Models;
using UnoOnline.Repositories;
using UnoOnline.WebSockets;

namespace UnoOnline
{
    public class Program
    {
        public static void Main(string[] args)
        {
            var builder = WebApplication.CreateBuilder(args);

            // 🔒 CORS
            builder.Services.AddCors(options =>
            {
                options.AddPolicy("AllowAllOrigins", builder =>
                {
                    builder.AllowAnyOrigin()
                           .AllowAnyHeader()
                           .AllowAnyMethod();
                });
            });

            // ✅ Servicios
            builder.Services.AddControllers();
            builder.Services.AddScoped<IUserRepository, UserRepository>();
            builder.Services.AddScoped<UserMapper>();
            builder.Services.AddScoped<IFriendshipRepository, FriendshipRepository>();
            builder.Services.AddScoped<FriendshipRepository>();
            builder.Services.AddScoped<FriendshipService>();
            builder.Services.AddScoped<IGameRoomRepository, GameRoomRepository>();
            builder.Services.AddScoped<GameRoomRepository>();
            builder.Services.AddTransient<IPasswordHasher, PasswordHasher>();
            builder.Services.AddScoped<middleware>();

            // 💾 Singleton para DataBaseContext
            builder.Services.AddDbContext<DataBaseContext>(options =>
            {
                options.UseSqlite("DataSource=uno.db");
            }, ServiceLifetime.Singleton);

            // 🚀 SignalR
            builder.Services.AddSignalR();

            // ✅ Singleton para WebSocketHandler
            builder.Services.AddSingleton<WebSocketHandler>(provider =>
            {
                var scopeFactory = provider.GetRequiredService<IServiceScopeFactory>();
                var hubContext = provider.GetRequiredService<Microsoft.AspNetCore.SignalR.IHubContext<GameHub>>();
                var dbContext = provider.GetRequiredService<DataBaseContext>();
                return new WebSocketHandler(scopeFactory, hubContext, dbContext);
            });

            // 🔒 Swagger
            builder.Services.AddEndpointsApiExplorer();
            builder.Services.AddSwaggerGen(options =>
            {
                options.AddSecurityDefinition(JwtBearerDefaults.AuthenticationScheme, new OpenApiSecurityScheme
                {
                    BearerFormat = "JWT",
                    Name = "Authorization",
                    Description = "Escribe **_SOLO_** tu token JWT",
                    In = ParameterLocation.Header,
                    Type = SecuritySchemeType.Http,
                    Scheme = JwtBearerDefaults.AuthenticationScheme
                });
                options.OperationFilter<SecurityRequirementsOperationFilter>(true, JwtBearerDefaults.AuthenticationScheme);
            });

            // 🔑 JWT Authentication
            builder.Services.AddAuthentication(options =>
            {
                options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
                options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
            }).AddJwtBearer(options =>
            {
                string key = Environment.GetEnvironmentVariable("JWT_KEY");
                if (string.IsNullOrEmpty(key))
                {
                    throw new Exception("JWT_KEY variable de entorno no está configurada.");
                }

                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = false,
                    ValidateAudience = false,
                    IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key)),
                    RoleClaimType = ClaimTypes.Role
                };
            });

            // 🌱 Construcción de la aplicación
            var app = builder.Build();

            // 💾 Inicialización de la base de datos
            using (IServiceScope scope = app.Services.CreateScope())
            {
                DataBaseContext dbcontext = scope.ServiceProvider.GetService<DataBaseContext>();
                dbcontext.Database.EnsureCreated();
            }

            // 🚦 Middleware
            if (app.Environment.IsDevelopment() || app.Environment.IsProduction())
            {
                app.UseSwagger();
                app.UseSwaggerUI();
            }

            app.UseWebSockets();
            app.UseMiddleware<middleware>();
            app.UseHttpsRedirection();
            app.UseRouting();
            app.UseAuthentication();
            app.UseAuthorization();
            app.UseStaticFiles();
            app.UseCors("AllowAllOrigins");
            app.MapControllers();

            // 📡 Mapear SignalR
            app.MapHub<GameHub>("/gameHub");

            // ▶️ Ejecutar
            app.Run();
        }
    }
}
