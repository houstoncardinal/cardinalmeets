import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  X,
  Pencil,
  Square,
  Circle,
  Type,
  Eraser,
  Undo2,
  Redo2,
  Trash2,
  Download,
  Minus,
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

type Tool = "pen" | "line" | "rect" | "ellipse" | "text" | "eraser";

interface DrawAction {
  tool: Tool;
  points: { x: number; y: number }[];
  color: string;
  width: number;
  text?: string;
}

interface WhiteboardPanelProps {
  onClose: () => void;
}

const COLORS = [
  "hsl(0, 0%, 100%)",
  "hsl(0, 84%, 60%)",
  "hsl(217, 91%, 50%)",
  "hsl(160, 84%, 39%)",
  "hsl(37, 90%, 51%)",
  "hsl(280, 65%, 60%)",
  "hsl(340, 75%, 55%)",
  "hsl(0, 0%, 0%)",
];

export function WhiteboardPanel({ onClose }: WhiteboardPanelProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [tool, setTool] = useState<Tool>("pen");
  const [color, setColor] = useState(COLORS[0]);
  const [strokeWidth, setStrokeWidth] = useState(3);
  const [isDrawing, setIsDrawing] = useState(false);
  const [actions, setActions] = useState<DrawAction[]>([]);
  const [undoneActions, setUndoneActions] = useState<DrawAction[]>([]);
  const [currentAction, setCurrentAction] = useState<DrawAction | null>(null);

  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
    redraw(actions);
  }, [actions]);

  useEffect(() => {
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    return () => window.removeEventListener("resize", resizeCanvas);
  }, [resizeCanvas]);

  const redraw = useCallback((drawActions: DrawAction[]) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawActions.forEach((action) => renderAction(ctx, action));
  }, []);

  const renderAction = (ctx: CanvasRenderingContext2D, action: DrawAction) => {
    ctx.strokeStyle = action.tool === "eraser" ? "hsl(220, 25%, 12%)" : action.color;
    ctx.fillStyle = action.color;
    ctx.lineWidth = action.tool === "eraser" ? action.width * 4 : action.width;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    if (action.tool === "pen" || action.tool === "eraser") {
      if (action.points.length < 2) return;
      ctx.beginPath();
      ctx.moveTo(action.points[0].x, action.points[0].y);
      for (let i = 1; i < action.points.length; i++) {
        ctx.lineTo(action.points[i].x, action.points[i].y);
      }
      ctx.stroke();
    } else if (action.tool === "line") {
      if (action.points.length < 2) return;
      ctx.beginPath();
      ctx.moveTo(action.points[0].x, action.points[0].y);
      ctx.lineTo(action.points[action.points.length - 1].x, action.points[action.points.length - 1].y);
      ctx.stroke();
    } else if (action.tool === "rect") {
      if (action.points.length < 2) return;
      const start = action.points[0];
      const end = action.points[action.points.length - 1];
      ctx.strokeRect(start.x, start.y, end.x - start.x, end.y - start.y);
    } else if (action.tool === "ellipse") {
      if (action.points.length < 2) return;
      const start = action.points[0];
      const end = action.points[action.points.length - 1];
      const cx = (start.x + end.x) / 2;
      const cy = (start.y + end.y) / 2;
      const rx = Math.abs(end.x - start.x) / 2;
      const ry = Math.abs(end.y - start.y) / 2;
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
      ctx.stroke();
    } else if (action.tool === "text" && action.text) {
      ctx.font = `${action.width * 5}px var(--font-sans, sans-serif)`;
      ctx.fillText(action.text, action.points[0].x, action.points[0].y);
    }
  };

  const getPos = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (tool === "text") {
      const pos = getPos(e);
      const text = prompt("Enter text:");
      if (text) {
        const action: DrawAction = { tool, points: [pos], color, width: strokeWidth, text };
        setActions((prev) => [...prev, action]);
        setUndoneActions([]);
        redraw([...actions, action]);
      }
      return;
    }
    setIsDrawing(true);
    const pos = getPos(e);
    setCurrentAction({ tool, points: [pos], color, width: strokeWidth });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !currentAction) return;
    const pos = getPos(e);
    const updated = { ...currentAction, points: [...currentAction.points, pos] };
    setCurrentAction(updated);
    redraw([...actions, updated]);
  };

  const handleMouseUp = () => {
    if (!isDrawing || !currentAction) return;
    setIsDrawing(false);
    setActions((prev) => [...prev, currentAction]);
    setUndoneActions([]);
    setCurrentAction(null);
  };

  const undo = () => {
    if (actions.length === 0) return;
    const last = actions[actions.length - 1];
    setActions((prev) => prev.slice(0, -1));
    setUndoneActions((prev) => [...prev, last]);
    redraw(actions.slice(0, -1));
  };

  const redo = () => {
    if (undoneActions.length === 0) return;
    const last = undoneActions[undoneActions.length - 1];
    setUndoneActions((prev) => prev.slice(0, -1));
    setActions((prev) => [...prev, last]);
    redraw([...actions, last]);
  };

  const clearAll = () => {
    setActions([]);
    setUndoneActions([]);
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  const downloadCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = "whiteboard.png";
    link.href = canvas.toDataURL();
    link.click();
  };

  const tools: { id: Tool; icon: React.ComponentType<{ className?: string }>; label: string }[] = [
    { id: "pen", icon: Pencil, label: "Pen" },
    { id: "line", icon: Minus, label: "Line" },
    { id: "rect", icon: Square, label: "Rectangle" },
    { id: "ellipse", icon: Circle, label: "Ellipse" },
    { id: "text", icon: Type, label: "Text" },
    { id: "eraser", icon: Eraser, label: "Eraser" },
  ];

  return (
    <div className="flex h-full w-full flex-col bg-meeting-bg">
      {/* Toolbar */}
      <div className="flex items-center gap-2 border-b border-meeting-border px-4 py-2">
        <div className="flex items-center gap-1">
          {tools.map((t) => (
            <Tooltip key={t.id}>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setTool(t.id)}
                  className={`h-8 w-8 p-0 ${
                    tool === t.id
                      ? "bg-primary text-primary-foreground"
                      : "text-meeting-text hover:bg-meeting-card"
                  }`}
                >
                  <t.icon className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{t.label}</TooltipContent>
            </Tooltip>
          ))}
        </div>

        <div className="mx-2 h-6 w-px bg-meeting-border" />

        {/* Colors */}
        <div className="flex items-center gap-1">
          {COLORS.map((c) => (
            <button
              key={c}
              onClick={() => setColor(c)}
              className={`h-6 w-6 rounded-full border-2 transition-transform ${
                color === c ? "scale-125 border-primary" : "border-meeting-border"
              }`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>

        <div className="mx-2 h-6 w-px bg-meeting-border" />

        {/* Stroke width */}
        <div className="flex w-24 items-center gap-2">
          <Slider
            value={[strokeWidth]}
            min={1}
            max={12}
            step={1}
            onValueChange={([v]) => setStrokeWidth(v)}
            className="w-full"
          />
        </div>

        <div className="mx-2 h-6 w-px bg-meeting-border" />

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="sm" onClick={undo} className="h-8 w-8 p-0 text-meeting-text hover:bg-meeting-card">
              <Undo2 className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Undo</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="sm" onClick={redo} className="h-8 w-8 p-0 text-meeting-text hover:bg-meeting-card">
              <Redo2 className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Redo</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="sm" onClick={clearAll} className="h-8 w-8 p-0 text-meeting-text hover:bg-meeting-card">
              <Trash2 className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Clear All</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="sm" onClick={downloadCanvas} className="h-8 w-8 p-0 text-meeting-text hover:bg-meeting-card">
              <Download className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Download</TooltipContent>
        </Tooltip>

        <div className="flex-1" />

        <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0 text-meeting-text hover:bg-meeting-card">
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Canvas */}
      <div ref={containerRef} className="flex-1 cursor-crosshair overflow-hidden">
        <canvas
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          className="h-full w-full"
        />
      </div>
    </div>
  );
}
