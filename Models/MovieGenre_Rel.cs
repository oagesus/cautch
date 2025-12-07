using System.ComponentModel.DataAnnotations.Schema;

namespace mudblazor_cinema.Models
{
    [Table("moviegenre_rel")]
    public class MovieGenre_Rel
    {
        [Column("movie_fk")]
        public int MovieFk { get; set; }
        
        [Column("genre_movie_fk")]
        public int GenreMovieFk { get; set; }
        
        public Movie Movie { get; set; } = null!;
        public Genre_Movie GenreMovie { get; set; } = null!;
    }
}