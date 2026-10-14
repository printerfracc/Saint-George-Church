// The plaintext phone and nationalId columns have been removed.
// This backfill already ran and must not be executed again.

console.error(
  "Legacy servant phone and nationalId columns were dropped after the encryption backfill. Nothing to migrate.",
);
process.exitCode = 1;
