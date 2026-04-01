/**
 * Production seed is intentionally minimal.
 * This project does not create demo users/data in production by default.
 */
async function main() {
  console.log(
    "[seed:prod] No demo seed executed. Production starts with empty user-generated data.",
  );
  console.log(
    "[seed:prod] If initial data becomes required later, add only operational minimum records here.",
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
