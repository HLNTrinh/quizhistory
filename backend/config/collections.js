import mongoose from "mongoose";
import Category from "../app/Models/Category.js";
import Package from "../app/Models/Package.js";
import Progress from "../app/Models/Progress.js";
import QuestionSet from "../app/Models/QuestionSet.js";
import Ranking from "../app/Models/Ranking.js";

const newCollections = [Package, QuestionSet, Progress, Category, Ranking];

export async function ensureCollections() {
  const database = mongoose.connection.db;
  const existing = new Set(
    (await database.listCollections({}, { nameOnly: true }).toArray()).map(({ name }) => name)
  );

  for (const model of newCollections) {
    if (!existing.has(model.collection.name)) {
      await model.createCollection();
    }
    await model.init();
  }
}
