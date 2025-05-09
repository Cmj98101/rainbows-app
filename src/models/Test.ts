import mongoose from "mongoose";

const testSchema = new mongoose.Schema({
  name: { type: String, required: true },
  date: { type: Date, required: true },
});

const Test = mongoose.models.Test || mongoose.model("Test", testSchema);
export default Test;
