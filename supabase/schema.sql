-- Guess the Price: Supabase schema. Server routes use the service role key; no client access needed yet.

create table if not exists daily_sets (
  day date primary key,
  homes jsonb not null,             -- Home[] (see src/lib/homes.ts), including sold prices: never expose to clients
  created_at timestamptz not null default now()
);

create table if not exists scores (
  day date not null,
  player_id text not null,          -- anonymous browser id today; auth.users id once accounts ship
  name text,
  state char(2),
  score int not null check (score between 0 and 500),
  tiers jsonb not null,
  created_at timestamptz not null default now(),
  primary key (day, player_id)
);

create index if not exists scores_day_score on scores (day, score desc);
create index if not exists scores_day_state_score on scores (day, state, score desc);

alter table daily_sets enable row level security;
alter table scores enable row level security;
-- No policies: only the service role (server) reads and writes.

-- Every player's guess per home, for the "X% of players guessed higher" line.
create table if not exists guesses (
  day date not null,
  home_index smallint not null check (home_index between 0 and 4),
  player_id text not null,
  guess int not null,
  created_at timestamptz not null default now(),
  primary key (day, home_index, player_id)
);
create index if not exists guesses_day_home_guess on guesses (day, home_index, guess);
alter table guesses enable row level security;
