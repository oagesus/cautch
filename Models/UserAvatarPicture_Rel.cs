using System.ComponentModel.DataAnnotations.Schema;

namespace mudblazor_cinema.Models
{
    [Table("useravatarpicture_rel")]
    public class UserAvatarPicture_Rel
    {
        public string UserFk { get; set; } = string.Empty;
        public int AvatarFk { get; set; }
        public DateTime UnlockedAt { get; set; }

        [ForeignKey("UserFk")]
        public User User { get; set; } = null!;

        [ForeignKey("AvatarFk")]
        public AvatarPicture AvatarPicture { get; set; } = null!;
    }
}