import { Model } from "mongoose";

interface IAttendance {
  date: string;
  present: string[];
  absent: string[];
}

declare const Attendance: Model<IAttendance>;
export default Attendance;
