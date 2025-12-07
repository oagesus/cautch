using System.ComponentModel.DataAnnotations.Schema;

namespace mudblazor_cinema.Models
{
    [Table("movieuserwatching_rel")]
    public class MovieUserWatching_Rel
    {
        [Column("movie_fk")]
        public int MovieFk { get; set; }
        
        [Column("user_fk")]
        public string UserFk { get; set; } = null!;
        
        [Column("updated_date")]
        public DateTime? UpdatedDate { get; set; }
        
        [Column("movie_time")]
        public TimeSpan MovieTime { get; set; }
        
        [Column("movie_time_max")]
        public TimeSpan MovieTimeMax { get; set; }
        
        public Movie Movie { get; set; } = null!;
        public User User { get; set; } = null!;
    }
}