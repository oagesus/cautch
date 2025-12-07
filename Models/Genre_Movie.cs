using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace mudblazor_cinema.Models
{
    [Table("genre_movie")]
    public class Genre_Movie
    {
        [Key]
        [Column("id")]
        public int Id { get; set; }
        
        [Required]
        [Column("name")]
        [MaxLength(255)]
        public string Name { get; set; } = string.Empty;
        
        public ICollection<MovieGenre_Rel> MovieGenres { get; set; } = new List<MovieGenre_Rel>();
    }
}