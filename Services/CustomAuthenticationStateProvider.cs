using System.Security.Claims;
using Microsoft.AspNetCore.Components.Authorization;
using Microsoft.AspNetCore.Components.Server;
using mudblazor_cinema.Data;
using Microsoft.EntityFrameworkCore;

namespace mudblazor_cinema.Services
{
    public class CustomAuthenticationStateProvider : RevalidatingServerAuthenticationStateProvider
    {
        private readonly IServiceScopeFactory _scopeFactory;
        private AuthenticationState? _cachedAuthState;

        public CustomAuthenticationStateProvider(
            ILoggerFactory loggerFactory,
            IServiceScopeFactory scopeFactory) 
            : base(loggerFactory)
        {
            _scopeFactory = scopeFactory;
        }

        protected override TimeSpan RevalidationInterval => TimeSpan.FromMinutes(30);

        public override async Task<AuthenticationState> GetAuthenticationStateAsync()
        {
            if (_cachedAuthState != null)
            {
                return _cachedAuthState;
            }

            var authState = await base.GetAuthenticationStateAsync();
            _cachedAuthState = authState;
            return authState;
        }

        protected override async Task<bool> ValidateAuthenticationStateAsync(
            AuthenticationState authenticationState, CancellationToken cancellationToken)
        {
            if (authenticationState?.User?.Identity?.IsAuthenticated != true)
            {
                _cachedAuthState = null;
                return false;
            }

            var uid = authenticationState.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(uid))
            {
                _cachedAuthState = null;
                return false;
            }

            using var scope = _scopeFactory.CreateScope();
            var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            
            var userExists = await dbContext.Users.AnyAsync(u => u.Uid == uid, cancellationToken);
            
            if (!userExists)
            {
                _cachedAuthState = null;
            }
            
            return userExists;
        }
    }
}