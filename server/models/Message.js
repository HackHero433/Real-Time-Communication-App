import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
  room: { type: mongoose.Schema.Types.ObjectId, ref: "Room", required: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  text: { type: String, required: true },
  attachedFile: { type: mongoose.Schema.Types.ObjectId, ref: "SharedFile" },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("Message", messageSchema);
