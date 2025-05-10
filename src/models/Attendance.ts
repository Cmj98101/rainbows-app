import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema({
  date: { type: String, required: true },
  present: [{ type: mongoose.Schema.Types.ObjectId, ref: "Student" }],
  absent: [{ type: mongoose.Schema.Types.ObjectId, ref: "Student" }],
});

export default mongoose.models.Attendance ||
  mongoose.model("Attendance", attendanceSchema);
