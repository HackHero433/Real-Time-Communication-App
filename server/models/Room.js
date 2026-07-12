import mongoose from "mongoose";

const participantSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    joinedAt: { type: Date, default: Date.now },
    leftAt: Date
  },
  { _id: false }
);

const roomSchema = new mongoose.Schema({
  roomId: { type: String, unique: true, required: true },
  name: { type: String, required: true, trim: true },
  host: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  participants: [participantSchema],
  isLocked: { type: Boolean, default: false },
  joinPasswordHash: String,
  recordingActive: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  endedAt: Date
});

export default mongoose.model("Room", roomSchema);
