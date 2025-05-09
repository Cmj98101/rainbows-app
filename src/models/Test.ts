import mongoose from "mongoose";

const testSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    date: { type: Date, required: true },
    description: { type: String },
    results: [
      {
        studentId: { type: mongoose.Schema.Types.ObjectId, ref: "Student" },
        passed: { type: Boolean, required: true },
        score: { type: Number },
      },
    ],
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Test || mongoose.model("Test", testSchema);
