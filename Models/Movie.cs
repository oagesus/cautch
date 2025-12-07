using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace mudblazor_cinema.Models
{
    [Table("movie")]
    public class Movie
    {
        [Key]
        public int Id { get; set; }
        
        [Required]
        public string Name { get; set; } = string.Empty;
        
        public int? Year { get; set; }
        
        [Required]
        public string VideoUrl { get; set; } = string.Empty;
        
        [Required]
        public string ImageUrl { get; set; } = string.Empty;
        
        public long? FileSizeBytes { get; set; }
        
        public DateTime? UploadDate { get; set; }
        
        public short? Runtime { get; set; }
        
        [Column(TypeName = "numeric(4,3)")]
        public decimal? VoteAverage { get; set; }

        public ICollection<MovieGenre_Rel> MovieGenres { get; set; } = new List<MovieGenre_Rel>();
        public ICollection<MovieUser_Rel> MovieUsers { get; set; } = new List<MovieUser_Rel>();
    }
}