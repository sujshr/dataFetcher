import { SMDB, SahayogDB } from "../connection/dbConnection.js";
import fetch from "node-fetch";

async function detectLanguage(inputText) {
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=en&dt=t&q=${encodeURI(
    inputText
  )}`;
  try {
    const response = await fetch(url);
    const json = await response.json();
    const detectedLanguage = json[2];
    return detectedLanguage;
  } catch (error) {
    console.error("Language detection error:", error);
    return "und"; 
  }
}

async function translate(
  inputText,
  inputLanguage = "auto",
  outputLanguage = "en"
) {
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${inputLanguage}&tl=${outputLanguage}&dt=t&q=${encodeURI(
    inputText
  )}`;
  try {
    const response = await fetch(url);
    const json = await response.json();
    return json[0].map((item) => item[0]).join("");
  } catch (error) {
    console.error("Translation error:", error);
    return inputText;
  }
}

export default async function transferPosts() {
  try {
    const smdb = SMDB.db();
    const smdbCollection = smdb.collection("unfilteredposts");

    const postsToTransfer = await smdbCollection
      .find({ fetched: false })
      .toArray();

    if (postsToTransfer.length === 0) {
      console.log("No posts found to transfer.");
      return "No posts found to transfer.";
    }

    const sahayogDB = SahayogDB.db();
    const sahayogCollection = sahayogDB.collection("unfilteredposts");

    for (const post of postsToTransfer) {
      const { text, imageUrl } = post.post;
      let translatedText = text;

      if (text) {
        const detectedLanguage = await detectLanguage(text);
        if (detectedLanguage !== "en") {
          translatedText = await translate(text, detectedLanguage, "en");
        }
      }

      const newPost = {
        user: post.user,
        post:
          translatedText === text
            ? {
                text,
                imageUrl: imageUrl,
              }
            : {
                text: translatedText,
                originalText: text,
                imageUrl: imageUrl,
              },
        fetched: false,
        timestamps: post.timestamps,
      };

      await sahayogCollection.insertOne(newPost);

      await smdbCollection.updateOne(
        { _id: post._id },
        { $set: { fetched: true } }
      );

      console.log(`Processed and transferred post ID: ${post._id}`);
    }

    console.log("All posts processed and transferred.");
    return "Data successfully transferred to SahayogDB.";
  } catch (error) {
    console.error("Error during the data transfer:", error);
    return error;
  }
}
