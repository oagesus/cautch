using System.ComponentModel.DataAnnotations.Schema;

namespace mudblazor_cinema.Models
{
    [Table("movieuser_rel")]
    public class MovieUser_Rel
    {
        [Column("movie_fk")]
        public int MovieFk { get; set; }
        
        [Column("user_fk")]
        public string UserFk { get; set; } = null!;
        
        [Column("added_date")]
        public DateTime? AddedDate { get; set; }
        
        public Movie Movie { get; set; } = null!;
        public User User { get; set; } = null!;
    }
}