using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace mudblazor_cinema.Models
{
    [Table("avatar_picture")]
    public class AvatarPicture
    {
        [Key]
        public int Id { get; set; }
        public string ImageUrl { get; set; } = string.Empty;
        public int WatchTimeCost { get; set; } = 0;
        public DateTime? AvailableFrom { get; set; }
        public DateTime? AvailableUntil { get; set; }
        public string Category { get; set; } = "Default";

        public ICollection<UserAvatarPicture_Rel> UserAvatars { get; set; } = new List<UserAvatarPicture_Rel>();
    }
}