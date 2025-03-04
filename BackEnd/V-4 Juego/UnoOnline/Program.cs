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
using UnoOnline.GameLogic;
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

            builder.Services.AddCors(options =>
            {
                options.AddPolicy("AllowAllOrigins", builder =>
                {
                    builder.AllowAnyOrigin()
                           .AllowAnyHeader()
                           .AllowAnyMethod();
                });
            });

            builder.Services.AddControllers();
            builder.Services.AddScoped<IUserRepository, UserRepository>();
            builder.Services.AddScoped<UserRepository>();
            builder.Services.AddScoped<UserMapper>();
            builder.Services.AddScoped<IFriendshipRepository, FriendshipRepository>();
            builder.Services.AddScoped<FriendshipRepository>();
            builder.Services.AddScoped<FriendshipService>();
            builder.Services.AddScoped<IGameRoomRepository, GameRoomRepository>();
            builder.Services.AddScoped<GameRoomRepository>();
            builder.Services.AddTransient<IPasswordHasher, PasswordHasher>();
            builder.Services.AddScoped<UnoGame>();
            builder.Services.AddScoped<WebSocketHandler>();
            builder.Services.AddScoped<DataBaseContext>();
            builder.Services.AddScoped<middleware>();

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

            using (IServiceScope scope = app.Services.CreateScope())
            {
                DataBaseContext dbcontext = scope.ServiceProvider.GetService<DataBaseContext>();
                dbcontext.Database.EnsureCreated();
            }

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
            app.Run();
        }
    }
}
