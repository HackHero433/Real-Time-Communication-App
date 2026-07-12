import mongoose from "mongoose";

const pointSchema = new mongoose.Schema(
  {
    x: Number,
    y: Number
  },
  { _id: false }
);

const strokeSchema = new mongoose.Schema(
  {
    tool: { type: String, default: "pen" },
    points: [pointSchema],
    color: { type: String, default: "#111827" },
    width: { type: Number, default: 4 },
    userId: String
  },
  { _id: false }
);

const whiteboardSnapshotSchema = new mongoose.Schema({
  room: { type: mongoose.Schema.Types.ObjectId, ref: "Room", required: true },
  strokes: [strokeSchema],
  savedAt: { type: Date, default: Date.now }
});

export default mongoose.model("WhiteboardSnapshot", whiteboardSnapshotSchema);
