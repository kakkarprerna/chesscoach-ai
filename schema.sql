-- Lichess puzzle store with derived material columns.
-- Run this in the Supabase SQL editor before the ingest script.

create table if not exists puzzles (
  puzzle_id         text primary key,
  fen               text        not null,
  moves             text[]      not null,      -- UCI, opponent's move first
  rating            int         not null,
  rating_deviation  int,
  popularity        int,
  nb_plays          int,
  themes            text[]      not null default '{}',
  game_url          text,
  opening_tags      text[]      not null default '{}',

  -- derived at ingest from the FEN
  material_sig      text        not null,      -- canonical matchup, e.g. 'NvR'
  white_material    text        not null,      -- non-pawn material, e.g. 'R'
  black_material    text        not null,
  solver_colour     char(1)     not null,      -- colour your son plays
  solver_material   text        not null,      -- his non-pawn material
  opponent_material text        not null,
  white_pawns       smallint    not null,
  black_pawns       smallint    not null,
  has_pawns         boolean     not null,
  piece_count       smallint    not null       -- kings included
);

-- The main query path: matchup + difficulty band.
create index if not exists puzzles_sig_rating_idx
  on puzzles (material_sig, rating);

-- "He has the rook, opponent has the knight" - directional queries.
create index if not exists puzzles_solver_matchup_idx
  on puzzles (solver_material, opponent_material, rating);

-- Theme filtering (rookEndgame, fork, mateIn2, ...).
create index if not exists puzzles_themes_idx
  on puzzles using gin (themes);

-- Difficulty-only browsing and endgame narrowing.
create index if not exists puzzles_rating_idx on puzzles (rating);
create index if not exists puzzles_piece_count_idx on puzzles (piece_count);

-- Track what he has already seen so you never repeat a puzzle.
create table if not exists puzzle_attempts (
  id          bigserial primary key,
  puzzle_id   text not null references puzzles (puzzle_id),
  solved      boolean not null,
  ms_taken    int,
  attempted_at timestamptz not null default now()
);

create index if not exists puzzle_attempts_puzzle_idx
  on puzzle_attempts (puzzle_id);

-- Random sampling without an expensive ORDER BY random() over millions of rows.
-- Picks a random offset inside the matching band instead.
create or replace function random_puzzles(
  p_material_sig text default null,
  p_themes       text[] default null,
  p_min_rating   int default 800,
  p_max_rating   int default 1600,
  p_has_pawns    boolean default null,
  p_max_pieces   int default null,
  p_min_popularity int default 70,
  p_limit        int default 10
)
returns setof puzzles
language sql stable
as $$
  select *
  from puzzles
  where (p_material_sig is null or material_sig = p_material_sig)
    and (p_themes is null or themes @> p_themes)
    and rating between p_min_rating and p_max_rating
    and (p_has_pawns is null or has_pawns = p_has_pawns)
    and (p_max_pieces is null or piece_count <= p_max_pieces)
    and coalesce(popularity, 0) >= p_min_popularity
    and puzzle_id not in (select puzzle_id from puzzle_attempts)
  order by random()
  limit p_limit;
$$;
