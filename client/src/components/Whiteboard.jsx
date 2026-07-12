import { Download, Eraser, Pencil, RotateCcw, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { api } from "../utils/api";

const colors = ["#111827", "#2563eb", "#16a34a", "#dc2626", "#f59e0b"];

export default function Whiteboard({ socket, roomId, userId }) {
  const canvasRef = useRef(null);
  const drawing = useRef(false);
  const currentStroke = useRef(null);
  const [strokes, setStrokes] = useState([]);
  const [tool, setTool] = useState("pen");
  const [color, setColor] = useState(colors[0]);
  const [width, setWidth] = useState(4);

  useEffect(() => {
    api(`/api/rooms/${roomId}/whiteboard`).then((data) => setStrokes(data.strokes)).catch(() => null);
  }, [roomId]);

  useEffect(() => {
    if (!socket) return undefined;
    const onDraw = (stroke) => setStrokes((current) => [...current, stroke]);
    const onClear = () => setStrokes([]);
    const onUndo = () => setStrokes((current) => current.slice(0, -1));
    socket.on("whiteboard:draw", onDraw);
    socket.on("whiteboard:clear", onClear);
    socket.on("whiteboard:undo", onUndo);
    return () => {
      socket.off("whiteboard:draw", onDraw);
      socket.off("whiteboard:clear", onClear);
      socket.off("whiteboard:undo", onUndo);
    };
  }, [socket]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
    const rect = canvas.getBoundingClientRect();
    const ratio = window.devicePixelRatio || 1;
    canvas.width = rect.width * ratio;
    canvas.height = rect.height * ratio;
    context.scale(ratio, ratio);
    context.clearRect(0, 0, rect.width, rect.height);
    strokes.forEach((stroke) => drawStroke(context, stroke));
  }, [strokes]);

  function pointer(event) {
    const rect = canvasRef.current.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  }

  function start(event) {
    drawing.current = true;
    currentStroke.current = {
      tool,
      color: tool === "eraser" ? "#ffffff" : color,
      width: tool === "eraser" ? width * 4 : width,
      userId,
      points: [pointer(event)]
    };
  }

  function move(event) {
    if (!drawing.current) return;
    const point = pointer(event);
    const stroke = currentStroke.current;
    stroke.points.push(point);
    const context = canvasRef.current.getContext("2d");
    drawStroke(context, stroke);
  }

  function end() {
    if (!drawing.current || !currentStroke.current) return;
    drawing.current = false;
    const stroke = currentStroke.current;
    currentStroke.current = null;
    setStrokes((current) => [...current, stroke]);
    socket.emit("whiteboard:draw", { roomId, stroke });
  }

  function undo() {
    setStrokes((current) => current.slice(0, -1));
    socket.emit("whiteboard:undo", { roomId });
  }

  function clear() {
    setStrokes([]);
    socket.emit("whiteboard:clear", { roomId });
  }

  function exportImage() {
    const link = document.createElement("a");
    link.download = `${roomId}-whiteboard.png`;
    link.href = canvasRef.current.toDataURL("image/png");
    link.click();
  }

  return (
    <section className="panel whiteboard-panel">
      <header className="whiteboard-toolbar">
        <h2>Whiteboard</h2>
        <div>
          <button className={tool === "pen" ? "active" : ""} title="Pen" onClick={() => setTool("pen")}>
            <Pencil size={16} />
          </button>
          <button className={tool === "eraser" ? "active" : ""} title="Eraser" onClick={() => setTool("eraser")}>
            <Eraser size={16} />
          </button>
          <button title="Undo" onClick={undo}>
            <RotateCcw size={16} />
          </button>
          <button title="Clear" onClick={clear}>
            <Trash2 size={16} />
          </button>
          <button title="Export" onClick={exportImage}>
            <Download size={16} />
          </button>
        </div>
      </header>
      <div className="swatches">
        {colors.map((item) => (
          <button
            key={item}
            className={color === item ? "selected" : ""}
            style={{ background: item }}
            title={item}
            onClick={() => setColor(item)}
          />
        ))}
        <input type="range" min="2" max="14" value={width} onChange={(event) => setWidth(Number(event.target.value))} />
      </div>
      <canvas
        ref={canvasRef}
        onPointerDown={start}
        onPointerMove={move}
        onPointerUp={end}
        onPointerLeave={end}
      />
    </section>
  );
}

function drawStroke(context, stroke) {
  const points = stroke.points || [];
  if (points.length < 1) return;
  context.strokeStyle = stroke.color;
  context.lineWidth = stroke.width;
  context.lineCap = "round";
  context.lineJoin = "round";
  context.beginPath();
  context.moveTo(points[0].x, points[0].y);
  points.slice(1).forEach((point) => context.lineTo(point.x, point.y));
  context.stroke();
}
