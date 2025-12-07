using Microsoft.EntityFrameworkCore;
using mudblazor_cinema.Models;

namespace mudblazor_cinema.Data

{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options)
            : base(options)
        {
        }

        public DbSet<User> Users { get; set; }
        public DbSet<Requested_User> Requested_Users { get; set; }
        public DbSet<Movie> Movies { get; set; }
        public DbSet<MovieUser_Rel> MovieUserRels { get; set; }
        public DbSet<MovieUserWatching_Rel> MovieUserWatchingRels { get; set; }
        public DbSet<AvatarPicture> AvatarPictures { get; set; }
        public DbSet<UserAvatarPicture_Rel> UserAvatarPictureRels { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<User>(entity =>
            {
                entity.ToTable("user");
                entity.HasKey(u => u.Uid);

                entity.Property(u => u.Uid).HasColumnName("uid");
                entity.Property(u => u.Email).HasColumnName("email");
                entity.Property(u => u.Password).HasColumnName("password");
                entity.Property(u => u.RegistrationDate).HasColumnName("registration_date");
                entity.Property(u => u.IsAdmin).HasColumnName("is_admin");
                entity.Property(u => u.WatchTimeTotal).HasColumnName("watch_time_total");
                entity.Property(u => u.WatchTimeBalance).HasColumnName("watch_time_balance");
                entity.Property(u => u.CurrentAvatarFk).HasColumnName("current_avatar_fk");

                entity.HasOne(u => u.CurrentAvatar)
                    .WithMany()
                    .HasForeignKey(u => u.CurrentAvatarFk)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            modelBuilder.Entity<Requested_User>(entity =>
            {
                entity.ToTable("requested_user");
                entity.HasKey(u => u.Uid);

                entity.Property(u => u.Uid).HasColumnName("uid");
                entity.Property(u => u.Email).HasColumnName("email");
                entity.Property(u => u.Password).HasColumnName("password");
                entity.Property(u => u.RegistrationDate).HasColumnName("registration_date");
                entity.Property(u => u.IsAdmin).HasColumnName("is_admin");
            });

            modelBuilder.Entity<Movie>(entity =>
            {
                entity.ToTable("movie");
                entity.HasKey(m => m.Id);

                entity.Property(m => m.Id)
                    .HasColumnName("id")
                    .UseIdentityColumn();

                entity.Property(m => m.Name)
                    .HasColumnName("name")
                    .IsRequired();

                entity.Property(m => m.Year)
                    .HasColumnName("year");

                entity.Property(m => m.VideoUrl)
                    .HasColumnName("video_url")
                    .IsRequired();

                entity.Property(m => m.ImageUrl)
                    .HasColumnName("image_url")
                    .IsRequired();

                entity.Property(m => m.FileSizeBytes)
                    .HasColumnName("file_size_bytes");

                entity.Property(m => m.UploadDate)
                    .HasColumnName("upload_date")
                    .HasColumnType("timestamp without time zone");

                entity.Property(m => m.Runtime)
                    .HasColumnName("runtime");

                entity.Property(m => m.VoteAverage)
                    .HasColumnName("vote_average")
                    .HasColumnType("numeric(4,3)");

                entity.HasIndex(m => new { m.Name, m.Year })
                    .HasDatabaseName("movie_name_year_unique")
                    .IsUnique();
            });

            modelBuilder.Entity<Genre_Movie>(entity =>
            {
                entity.ToTable("genre_movie");
                entity.HasKey(g => g.Id);

                entity.Property(g => g.Id)
                    .HasColumnName("id")
                    .ValueGeneratedNever();

                entity.Property(g => g.Name)
                    .HasColumnName("name")
                    .HasMaxLength(255)
                    .IsRequired();
            });

            modelBuilder.Entity<MovieGenre_Rel>(entity =>
            {
                entity.ToTable("moviegenre_rel");

                entity.HasKey(mg => new { mg.MovieFk, mg.GenreMovieFk });

                entity.Property(mg => mg.MovieFk)
                    .HasColumnName("movie_fk");

                entity.Property(mg => mg.GenreMovieFk)
                    .HasColumnName("genre_movie_fk");

                entity.HasOne(mg => mg.Movie)
                    .WithMany(m => m.MovieGenres)
                    .HasForeignKey(mg => mg.MovieFk)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(mg => mg.GenreMovie)
                    .WithMany(g => g.MovieGenres)
                    .HasForeignKey(mg => mg.GenreMovieFk)
                    .OnDelete(DeleteBehavior.Cascade);
            });
            
            modelBuilder.Entity<MovieUser_Rel>(entity =>
            {
                entity.ToTable("movieuser_rel");
                
                entity.HasKey(mu => new { mu.MovieFk, mu.UserFk });

                entity.Property(mu => mu.MovieFk)
                    .HasColumnName("movie_fk");

                entity.Property(mu => mu.UserFk)
                    .HasColumnName("user_fk");

                entity.Property(mu => mu.AddedDate)
                    .HasColumnName("added_date")
                    .HasColumnType("timestamp without time zone");

                entity.HasOne(mu => mu.Movie)
                    .WithMany(m => m.MovieUsers)
                    .HasForeignKey(mu => mu.MovieFk)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(mu => mu.User)
                    .WithMany(u => u.MovieUsers)
                    .HasForeignKey(mu => mu.UserFk)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            modelBuilder.Entity<MovieUserWatching_Rel>(entity =>
            {
                entity.ToTable("movieuserwatching_rel");
                
                entity.HasKey(mu => new { mu.MovieFk, mu.UserFk });

                entity.Property(mu => mu.MovieFk)
                    .HasColumnName("movie_fk");

                entity.Property(mu => mu.UserFk)
                    .HasColumnName("user_fk");

                entity.Property(mu => mu.UpdatedDate)
                    .HasColumnName("updated_date")
                    .HasColumnType("timestamp without time zone");

                entity.Property(mu => mu.MovieTime)
                    .HasColumnName("movie_time");

                entity.Property(mu => mu.MovieTimeMax)
                    .HasColumnName("movie_time_max");

                entity.HasOne(mu => mu.Movie)
                    .WithMany()
                    .HasForeignKey(mu => mu.MovieFk)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(mu => mu.User)
                    .WithMany()
                    .HasForeignKey(mu => mu.UserFk)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            modelBuilder.Entity<AvatarPicture>(entity =>
            {
                entity.ToTable("avatar_picture");
                entity.HasKey(a => a.Id);

                entity.Property(a => a.Id)
                    .HasColumnName("id")
                    .UseIdentityColumn();

                entity.Property(a => a.ImageUrl)
                    .HasColumnName("image_url")
                    .IsRequired();

                entity.Property(a => a.WatchTimeCost)
                    .HasColumnName("watch_time_cost");

                entity.Property(a => a.AvailableFrom)
                    .HasColumnName("available_from")
                    .HasColumnType("timestamp without time zone");

                entity.Property(a => a.AvailableUntil)
                    .HasColumnName("available_until")
                    .HasColumnType("timestamp without time zone");

                entity.Property(a => a.Category)
                    .HasColumnName("category")
                    .HasMaxLength(100)
                    .IsRequired();
            });

            modelBuilder.Entity<UserAvatarPicture_Rel>(entity =>
            {
                entity.ToTable("useravatarpicture_rel");

                entity.HasKey(ua => new { ua.UserFk, ua.AvatarFk });

                entity.Property(ua => ua.UserFk)
                    .HasColumnName("user_fk");

                entity.Property(ua => ua.AvatarFk)
                    .HasColumnName("avatar_fk");

                entity.Property(ua => ua.UnlockedAt)
                    .HasColumnName("unlocked_at")
                    .HasColumnType("timestamp without time zone");

                entity.HasOne(ua => ua.User)
                    .WithMany(u => u.UserAvatars)
                    .HasForeignKey(ua => ua.UserFk)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(ua => ua.AvatarPicture)
                    .WithMany(a => a.UserAvatars)
                    .HasForeignKey(ua => ua.AvatarFk)
                    .OnDelete(DeleteBehavior.Cascade);
            });
        }
    }
}