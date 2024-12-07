import { MongoClient } from "mongodb";
import "dotenv/config";

const SMDB = new MongoClient(process.env.MONGODB_ATLAS_SOCIAL_MEDIA_DB);
const SahayogDB = new MongoClient(process.env.MONGODB_ATLAS_URI);

export async function connectDB() {
  try {
    await SahayogDB.connect();
    console.log("Successfully connected to sahyag db");

    await SMDB.connect();
    console.log("Successfully connected to Socail media Db");
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
    process.exit(1);
  }
}

export { SahayogDB, SMDB };
