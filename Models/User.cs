using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace mudblazor_cinema.Models
{
    [Table("user")]
    public class User
    {
        [Key]
        public string Uid { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public DateTime RegistrationDate { get; set; }
        public bool IsAdmin { get; set; } = false;
        public int WatchTimeTotal { get; set; } = 0;
        public int WatchTimeBalance { get; set; } = 0;
        public int CurrentAvatarFk { get; set; } = 1;

        [ForeignKey("CurrentAvatarFk")]
        public AvatarPicture? CurrentAvatar { get; set; }

        public ICollection<MovieUser_Rel> MovieUsers { get; set; } = new List<MovieUser_Rel>();
        public ICollection<UserAvatarPicture_Rel> UserAvatars { get; set; } = new List<UserAvatarPicture_Rel>();
    }
}