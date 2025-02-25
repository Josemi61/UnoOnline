//using Examples.WebApi.Services;
using Memory.Service;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.Extensions.FileProviders;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using Swashbuckle.AspNetCore.Filters;
using System.Security.Claims;
using System.Text;
using UnoOnline.Data;
using UnoOnline.DataMappers;
using UnoOnline.Interfaces;
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

            // Agregar CORS
            builder.Services.AddCors(options =>
            {
                options.AddPolicy("AllowAllOrigins", builder =>
                {
                    builder.AllowAnyOrigin()    // Permite cualquier origen (incluyendo todos los puertos de localhost)
                           .AllowAnyHeader()    // Permite cualquier encabezado
                           .AllowAnyMethod();   // Permite cualquier m�todo (GET, POST, etc.)
                });
            });

            // Add services to the container.
            builder.Services.AddControllers();
            builder.Services.AddScoped<IUserRepository, UserRepository>();
            builder.Services.AddScoped<UserMapper>();
            builder.Services.AddScoped<IFriendshipRepository, FriendshipRepository>();
            builder.Services.AddScoped<FriendshipRepository>();
            builder.Services.AddScoped<FriendshipService>();
            builder.Services.AddScoped<IGameRoomRepository, GameRoomRepository>();
            builder.Services.AddScoped<GameRoomRepository>();
            builder.Services.AddTransient<IPasswordHasher, PasswordHasher>();
            builder.Services.AddSingleton<WebSocketHandler>();
            builder.Services.AddScoped<DataBaseContext>();
            
            // Swagger configuration
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

            // JWT Authentication configuration
            builder.Services.AddAuthentication(options =>
            {
                options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
                options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
            }).AddJwtBearer(options =>
            {
                string key = Environment.GetEnvironmentVariable("JWT_KEY");
                if (string.IsNullOrEmpty(key))
                {
                    throw new Exception("JWT_KEY variable de entorno no est� configurada.");
                }

                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = false,
                    ValidateAudience = false,
                    IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key)),
                    RoleClaimType = ClaimTypes.Role
                };
            });

            var app = builder.Build();

            // Database initialization
            using (IServiceScope scope = app.Services.CreateScope())
            {
                DataBaseContext dbcontext = scope.ServiceProvider.GetService<DataBaseContext>();
                dbcontext.Database.EnsureCreated();
            }

            // Habilitar Swagger y CORS para desarrollo o producci�n
            if (app.Environment.IsDevelopment() || app.Environment.IsProduction())
            {
                app.UseSwagger();
                app.UseSwaggerUI();
            }

            app.UseCors("AllowAllOrigins"); // Aplica la pol�tica de CORS

            app.UseWebSockets();
            app.UseHttpsRedirection();
            app.UseAuthentication();
            app.UseAuthorization();
            app.UseStaticFiles();
            app.MapControllers();
            app.Run();
        }
    }
}
