import { initTable } from "./table";

(async () => {
  try {
    await initTable();
    console.log("Tunisia test table created");
  } catch (error) {
    console.error(error.message);
  }
  process.exit(0);
})();
