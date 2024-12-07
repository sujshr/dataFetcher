import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { connectDB } from "./connection/dbConnection";
import transferPosts from "./scripts/transferPosts";

const app = new Hono();

await connectDB();

app.get("/", async (c) => {
  const res = await transferPosts();
  return c.text(res);
});

const processInterval = 15000;

const runTransferPosts = async () => {
  console.log("Starting transferPosts batch...");
  const result = await transferPosts();
  console.log(result);
  console.log("Batch processed, waiting for next run...");
};

runTransferPosts();

setInterval(runTransferPosts, processInterval);

const port = 3000;
console.log(`Server is running on http://localhost:${port}`);

serve({
  fetch: app.fetch,
  port,
});
