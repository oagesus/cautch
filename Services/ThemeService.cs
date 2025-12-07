using MudBlazor;
using Microsoft.JSInterop;

namespace mudblazor_cinema.Services
{
    public class ThemeService
    {
        private bool _isDarkMode = true;
        private bool _isToggling = false;
        private bool _isInitialized = false;
        
        public event Action? OnThemeChanged;
        
        public MudTheme Theme { get; }
        
        public bool IsDarkMode => _isDarkMode;
        
        public ThemeService()
        {
            Theme = new MudTheme()
            {
                PaletteLight = _lightPalette,
                PaletteDark = _darkPalette,
                LayoutProperties = new LayoutProperties()
            };
        }
        
        public async Task InitializeAsync(IJSRuntime jsRuntime)
        {
            if (_isInitialized) return;
            
            try
            {
                var savedTheme = await jsRuntime.InvokeAsync<string>("localStorage.getItem", "darkMode");
                if (!string.IsNullOrEmpty(savedTheme))
                {
                    _isDarkMode = bool.Parse(savedTheme);
                }
                else
                {
                    _isDarkMode = true;
                }
                _isInitialized = true;
            }
            catch
            {
                _isDarkMode = true;
                _isInitialized = true;
            }
        }
        
        public async Task ToggleDarkModeAsync(IJSRuntime jsRuntime)
        {
            if (_isToggling) return;
            
            _isToggling = true;
            
            try
            {
                _isDarkMode = !_isDarkMode;
                await jsRuntime.InvokeVoidAsync("localStorage.setItem", "darkMode", _isDarkMode.ToString());
                
                // Event auf dem UI Thread aufrufen
                OnThemeChanged?.Invoke();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error toggling theme: {ex.Message}");
            }
            finally
            {
                _isToggling = false;
            }
        }
        
        public string DarkLightModeButtonIcon => _isDarkMode
            ? Icons.Material.Rounded.DarkMode
            : Icons.Material.Outlined.LightMode;
        
        private readonly PaletteLight _lightPalette = new()
        {
            Black = "#110e2d",
            AppbarText = "#424242",
            AppbarBackground = "rgba(255,255,255,0.8)",
            DrawerBackground = "#ffffff",
            GrayLight = "#e8e8e8",
            GrayLighter = "#f9f9f9",
        };
        
        private readonly PaletteDark _darkPalette = new()
        {
            Primary = "#7e6fff",
            Surface = "#1e1e2d",
            Background = "#1a1a27",
            BackgroundGray = "#151521",
            AppbarText = "#92929f",
            AppbarBackground = "rgba(26,26,39,0.8)",
            DrawerBackground = "#1a1a27",
            ActionDefault = "#74718e",
            ActionDisabled = "#9999994d",
            ActionDisabledBackground = "#605f6d4d",
            TextPrimary = "#b2b0bf",
            TextSecondary = "#92929f",
            TextDisabled = "#ffffff33",
            DrawerIcon = "#92929f",
            DrawerText = "#92929f",
            GrayLight = "#2a2833",
            GrayLighter = "#1e1e2d",
            Info = "#4a86ff",
            Success = "#3dcb6c",
            Warning = "#ffb545",
            Error = "#ff3f5f",
            LinesDefault = "#33323e",
            TableLines = "#33323e",
            Divider = "#292838",
            OverlayLight = "#1e1e2d80",
        };
    }
}