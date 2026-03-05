# Cautch

A self-hosted movie streaming app built with Blazor Server and MudBlazor. Stream movies from your NAS with authentication, watch tracking, and gamification.

## Features

- **Movie Browsing** - Search by name, filter by genre, and multiple sorting options
- **Watchlist** - Save movies to your personal watchlist
- **Video Playback** - Stream with progress tracking and resume
- **Authentication** - Registration with admin approval
- **Gamification** - Earn XP and coins from watching, level up, unlock avatars
- **User Profiles** - Watch time stats, level, and avatar collection
- **Admin Panel** - Approve/reject registration requests

## Tech Stack

| Layer          | Technology                                      |
| -------------- | ----------------------------------------------- |
| Framework      | .NET 9.0 / Blazor Server                        |
| UI Components  | MudBlazor 8.x (Material Design)                 |
| Database       | PostgreSQL 17 with Entity Framework Core 9       |
| Auth           | ASP.NET Cookie Authentication                    |
| Video Player   | Blazored.Video                                   |
| Hosting        | Docker                                           |
| CI/CD          | GitHub Actions + Docker Hub                      |
| Media Storage  | SMB/CIFS network share (NAS)                     |

## Setup

### 1. Install Docker

Download and install [Docker](https://docs.docker.com/get-docker/).

### 2. Download the required files

Download [compose.yaml](compose.yaml) and [compose.override.yaml](compose.override.yaml), create a `.env` file, and place them in the same folder:

```
cautch/
├── compose.yaml
├── compose.override.yaml
└── .env
```

### 3. Fill in the .env file

```env
POSTGRES_PASSWORD=your_postgres_password   # PostgreSQL password
SMB_HOST=your_nas_hostname_or_ip           # NAS hostname or IP
SMB_SHARE=your_share_name                  # NAS shared folder name
SMB_USER=your_smb_username                 # NAS username
SMB_PASSWORD=your_smb_password             # NAS password
```

**Note:** Never share or commit your `.env` file.

### 4. Start the app

Open a terminal, navigate to your folder, and run:

```
docker compose up -d
```

This starts three containers:

- **db** — PostgreSQL database
- **server** — web app on port 8080
- **adminer** — database browser on port 8081

To view logs: `docker compose logs -f`
To stop: `docker compose down`

### 5. Add movies

Use Adminer at `http://localhost:8081` to insert rows into the `movie` table:

| Column            | Description                            |
| ----------------- | -------------------------------------- |
| `name`            | Movie title                            |
| `year`            | Release year                           |
| `video_url`       | Video file path relative to NAS share  |
| `image_url`       | Cover image path relative to NAS share |
| `file_size_bytes` | File size in bytes                     |
| `upload_date`     | Date added                             |
| `runtime`         | Duration in minutes                    |
| `vote_average`    | Rating (e.g. `7.500`)                  |

To assign genres, insert into `genre_movie` first, then link in `moviegenre_rel`.

### 6. Create the first admin user

1. Register at `http://localhost:8080`.
2. Open Adminer at `http://localhost:8081` and log in with:
   - **System:** PostgreSQL
   - **Server:** db
   - **Username:** postgres
   - **Password:** devpassword
   - **Database:** mudblazor_cinema_dev
3. Copy your entry from `requested_user` into `user` and set `is_admin` to `true`.
4. Log in. You can now approve future registrations from `/requestedusers`.

## License

[MIT](LICENSE)
