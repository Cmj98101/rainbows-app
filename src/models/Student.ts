import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  present: { type: Boolean, required: true },
});

const testResultSchema = new mongoose.Schema({
  testName: { type: String, required: true },
  date: { type: Date, required: true },
  passed: { type: Boolean, required: true },
  score: { type: Number },
});

const guardianSchema = new mongoose.Schema({
  name: { type: String, required: true },
  relationship: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String },
  address: { type: String },
  isEmergencyContact: { type: Boolean, default: false },
});

const studentSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    birthday: { type: Date, required: true },
    gender: { type: String, required: true },
    email: { type: String },
    phone: { type: String },
    address: { type: String },
    guardians: [guardianSchema],
    notes: { type: String },
    attendance: [attendanceSchema],
    testResults: [testResultSchema],
  },
  {
    timestamps: true,
  }
);

// Virtual for full name
studentSchema.virtual("fullName").get(function () {
  return `${this.firstName} ${this.lastName}`;
});

// Ensure virtuals are included when converting to JSON
studentSchema.set("toJSON", { virtuals: true });
studentSchema.set("toObject", { virtuals: true });

const Student =
  mongoose.models.Student || mongoose.model("Student", studentSchema);

export default Student;
