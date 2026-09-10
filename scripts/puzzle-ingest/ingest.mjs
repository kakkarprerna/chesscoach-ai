/**
 * One-off ingest: Lichess puzzle CSV -> Supabase, with derived material columns.
 *
 * Setup:
 *   curl -O https://database.lichess.org/lichess_db_puzzle.csv.zst
 *   brew install zstd && zstd -d lichess_db_puzzle.csv.zst
 *   npm i @supabase/supabase-js csv-parse
 *
 * Run:
 *   SUPABASE_URL="https://lpwzqzsyxuynimcuccpp.supabase.co" SUPABASE_SERVICE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxwd3pxenN5eHV5bmltY3VjY3BwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4ODg1NDQ2NCwiZXhwIjoyMTA0NDMwNDY0fQ.GIgLt89au9j11wu9TLzKS9CwXZBZfJrCKaXYN3Db3jA" node ingest.mjs lichess_db_puzzle.csv
 *
 * Use the SERVICE ROLE key, not the anon key. The anon key will be blocked by
 * row level security and you will watch 5 million rows silently fail to insert.
 */

import fs from 'node:fs';
import { parse } from 'csv-parse';
import { createClient } from '@supabase/supabase-js';
import { deriveMaterial } from './fen-material.mjs';

const CSV_PATH = process.argv[2] ?? 'lichess_db_puzzle.csv';
const BATCH_SIZE = 5000;

// ---------------------------------------------------------------------------
// Ingest filter.
//
// The full dump is roughly 5 million puzzles and will not fit in a Supabase
// free tier (500 MB). Narrow it here. The defaults below keep puzzles in a
// sensible band for an 8 year old plus headroom to grow into, and drop the
// unpopular ones, which lands somewhere around 400k rows.
//
// Set KEEP_EVERYTHING=1 if you are on a paid plan and want the lot.
// ---------------------------------------------------------------------------
const KEEP_EVERYTHING = process.env.KEEP_EVERYTHING === '1';

const MIN_RATING = Number(process.env.MIN_RATING ?? 600);
const MAX_RATING = Number(process.env.MAX_RATING ?? 2000);
const MIN_POPULARITY = Number(process.env.MIN_POPULARITY ?? 70);
const MIN_PLAYS = Number(process.env.MIN_PLAYS ?? 100);
const MAX_PIECES = Number(process.env.MAX_PIECES ?? 10);

function shouldKeep(row) {
  if (KEEP_EVERYTHING) return true;
  if (row.rating < MIN_RATING || row.rating > MAX_RATING) return false;
  if ((row.popularity ?? 0) < MIN_POPULARITY) return false;
  if ((row.nb_plays ?? 0) < MIN_PLAYS) return false;
  if (row.piece_count > MAX_PIECES) return false;
  return true;
}

// ---------------------------------------------------------------------------

const DRY_RUN = process.env.DRY_RUN === '1';

const supabase = DRY_RUN
  ? null
  : createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY,
      { auth: { persistSession: false } }
    );
function toInt(value) {
  const n = Number.parseInt(value, 10);
  return Number.isNaN(n) ? null : n;
}

function toArray(value) {
  if (!value) return [];
  return value.trim().split(/\s+/).filter(Boolean);
}

function buildRow(record) {
  const fen = record.FEN;
  const derived = deriveMaterial(fen);

  return {
    puzzle_id: record.PuzzleId,
    fen,
    moves: toArray(record.Moves),
    rating: toInt(record.Rating),
    rating_deviation: toInt(record.RatingDeviation),
    popularity: toInt(record.Popularity),
    nb_plays: toInt(record.NbPlays),
    themes: toArray(record.Themes),
    game_url: record.GameUrl || null,
    opening_tags: toArray(record.OpeningTags),
    ...derived,
  };
}

async function flush(batch) {
  if (DRY_RUN) return;
  if (process.env.DRY_RUN === '1') return;
  const { error } = await supabase
    .from('puzzles')
    .upsert(batch, { onConflict: 'puzzle_id', returning: 'minimal' });

  if (error) {
    console.error('Insert failed:', error.message);
    console.error('First row of failing batch:', batch[0]?.puzzle_id);
    process.exit(1);
  }
}

async function main() {
  if (!DRY_RUN && (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY)) {
    console.error('Set SUPABASE_URL and SUPABASE_SERVICE_KEY first.');
    process.exit(1);
  }
  if (!fs.existsSync(CSV_PATH)) {
    console.error(`CSV not found at ${CSV_PATH}`);
    process.exit(1);
  }

  const parser = fs
    .createReadStream(CSV_PATH)
    .pipe(parse({ columns: true, skip_empty_lines: true, relax_column_count: true }));

  let batch = [];
  let read = 0;
  let kept = 0;
  let skipped = 0;
  const started = Date.now();

  for await (const record of parser) {
    read += 1;

    let row;
    try {
      row = buildRow(record);
    } catch (err) {
      skipped += 1;
      continue; // malformed FEN, rare but not worth stopping for
    }

    if (!shouldKeep(row)) continue;

    batch.push(row);
    kept += 1;

    if (batch.length >= BATCH_SIZE) {
      await flush(batch);
      batch = [];
      const mins = ((Date.now() - started) / 60000).toFixed(1);
      process.stdout.write(
        `\rread ${read.toLocaleString()} | kept ${kept.toLocaleString()} | ${mins}m`
      );
    }
  }

  if (batch.length) await flush(batch);

  console.log(
    `\nDone. Read ${read.toLocaleString()}, inserted ${kept.toLocaleString()}, skipped ${skipped} malformed.`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
