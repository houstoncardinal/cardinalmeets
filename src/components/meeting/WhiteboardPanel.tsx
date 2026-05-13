import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  X, Pencil, Square, Circle, Type, Eraser, Undo2, Redo2,
  Trash2, Download, Minus, Users,
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { RealtimeChannel } from "@supabase/supabase-js";

type Tool = "pen" | "line" | "rect" | "ellipse" | "text" | "eraser";

interface DrawAction {
  id: string;
  authorId: string;
  tool: Tool;
  points: { x: number; y: number }[];
  color: string;
  width: number;
  text?: string;
}

interface WhiteboardPanelProps {
  onClose: () => void;
  meetingId: string;
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

export function WhiteboardPanel({ onClose, meetingId }: WhiteboardPanelProps) {
  const { user } = useAuth();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const actionsRef = useRef<DrawAction[]>([]);
  const [tool, setTool] = useState<Tool>("pen");
  const [color, setColor] = useState(COLORS[0]);
  const [strokeWidth, setStrokeWidth] = useState(3);
  const [isDrawing, setIsDrawing] = useState(false);
  const [actions, setActions] = useState<DrawAction[]>([]);
  const [undone, setUndone] = useState<DrawAction[]>([]);
  const [current, setCurrent] = useState<DrawAction | null>(null);
  const [collaborators, setCollaborators] = useState(1);

  useEffect(() => { actionsRef.current = actions; }, [actions]);

  const renderAction = (ctx: CanvasRenderingContext2D, a: DrawAction) => {
    ctx.strokeStyle = a.tool === "eraser" ? "hsl(220, 25%, 12%)" : a.color;
    ctx.fillStyle = a.color;
    ctx.lineWidth = a.tool === "eraser" ? a.width * 4 : a.width;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    if (a.tool === "pen" || a.tool === "eraser") {
      if (a.points.length < 2) return;
      ctx.beginPath();
      ctx.moveTo(a.points[0].x, a.points[0].y);
      for (let i = 1; i < a.points.length; i++) ctx.lineTo(a.points[i].x, a.points[i].y);
      ctx.stroke();
    } else if (a.tool === "line") {
      if (a.points.length < 2) return;
      ctx.beginPath();
      ctx.moveTo(a.points[0].x, a.points[0].y);
      ctx.lineTo(a.points[a.points.length - 1].x, a.points[a.points.length - 1].y);
      ctx.stroke();
    } else if (a.tool === "rect") {
      if (a.points.length < 2) return;
      const s = a.points[0], e = a.points[a.points.length - 1];
      ctx.strokeRect(s.x, s.y, e.x - s.x, e.y - s.y);
    } else if (a.tool === "ellipse") {
      if (a.points.length < 2) return;
      const s = a.points[0], e = a.points[a.points.length - 1];
      ctx.beginPath();
      ctx.ellipse((s.x + e.x) / 2, (s.y + e.y) / 2, Math.abs(e.x - s.x) / 2, Math.abs(e.y - s.y) / 2, 0, 0, Math.PI * 2);
      ctx.stroke();
    } else if (a.tool === "text" && a.text) {
      ctx.font = `${a.width * 5}px var(--font-sans, sans-serif)`;
      ctx.fillText(a.text, a.points[0].x, a.points[0].y);
    }
  };

  const redraw = useCallback((list: DrawAction[], inProgress?: DrawAction | null) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    list.forEach((a) => renderAction(ctx, a));
    if (inProgress) renderAction(ctx, inProgress);
  }, []);

  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
    redraw(actionsRef.current);
  }, [redraw]);

  useEffect(() => {
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    return () => window.removeEventListener("resize", resizeCanvas);
  }, [resizeCanvas]);

  // Realtime sync
  useEffect(() => {
    if (!meetingId || !user) return;
    const channel = supabase.channel(`whiteboard:${meetingId}`, {
      config: { presence: { key: user.id }, broadcast: { self: false } },
    });

    channel
      .on("broadcast", { event: "draw" }, ({ payload }) => {
        const a = payload as DrawAction;
        setActions((prev) => {
          const next = [...prev, a];
          redraw(next);
          return next;
        });
      })
      .on("broadcast", { event: "clear" }, () => {
        setActions([]);
        setUndone([]);
        redraw([]);
      })
      .on("broadcast", { event: "undo" }, ({ payload }) => {
        const id = (payload as { id: string }).id;
        setActions((prev) => {
          const next = prev.filter((a) => a.id !== id);
          redraw(next);
          return next;
        });
      })
      .on("broadcast", { event: "request-sync" }, ({ payload }) => {
        // Respond with current state
        channel.send({
          type: "broadcast",
          event: "sync-state",
          payload: { to: (payload as { from: string }).from, actions: actionsRef.current },
        });
      })
      .on("broadcast", { event: "sync-state" }, ({ payload }) => {
        const p = payload as { to: string; actions: DrawAction[] };
        if (p.to !== user.id) return;
        if (actionsRef.current.length === 0 && p.actions.length > 0) {
          setActions(p.actions);
          redraw(p.actions);
        }
      })
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        setCollaborators(Object.keys(state).length);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({ user_id: user.id, joined_at: Date.now() });
          // Ask peers for current state
          channel.send({ type: "broadcast", event: "request-sync", payload: { from: user.id } });
        }
      });

    channelRef.current = channel;
    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [meetingId, user, redraw]);

  const broadcast = (event: string, payload: Record<string, unknown>) => {
    channelRef.current?.send({ type: "broadcast", event, payload });
  };

  const getPos = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const commitAction = (a: DrawAction) => {
    setActions((prev) => {
      const next = [...prev, a];
      redraw(next);
      return next;
    });
    setUndone([]);
    broadcast("draw", a as unknown as Record<string, unknown>);
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!user) return;
    if (tool === "text") {
      const pos = getPos(e);
      const text = prompt("Enter text:");
      if (text) {
        commitAction({
          id: crypto.randomUUID(), authorId: user.id, tool, points: [pos], color, width: strokeWidth, text,
        });
      }
      return;
    }
    setIsDrawing(true);
    const pos = getPos(e);
    setCurrent({ id: crypto.randomUUID(), authorId: user.id, tool, points: [pos], color, width: strokeWidth });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !current) return;
    const pos = getPos(e);
    const updated = { ...current, points: [...current.points, pos] };
    setCurrent(updated);
    redraw(actionsRef.current, updated);
  };

  const handleMouseUp = () => {
    if (!isDrawing || !current) return;
    setIsDrawing(false);
    commitAction(current);
    setCurrent(null);
  };

  const undo = () => {
    if (actions.length === 0) return;
    const last = actions[actions.length - 1];
    const next = actions.slice(0, -1);
    setActions(next);
    setUndone((p) => [...p, last]);
    redraw(next);
    broadcast("undo", { id: last.id });
  };

  const redo = () => {
    if (undone.length === 0) return;
    const last = undone[undone.length - 1];
    setUndone((p) => p.slice(0, -1));
    commitAction(last);
  };

  const clearAll = () => {
    setActions([]);
    setUndone([]);
    redraw([]);
    broadcast("clear", {});
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
      <div className="flex items-center gap-2 border-b border-meeting-border px-4 py-2">
        <div className="flex items-center gap-1">
          {tools.map((t) => (
            <Tooltip key={t.id}>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="sm" onClick={() => setTool(t.id)}
                  className={`h-8 w-8 p-0 ${tool === t.id ? "bg-primary text-primary-foreground" : "text-meeting-text hover:bg-meeting-card"}`}>
                  <t.icon className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{t.label}</TooltipContent>
            </Tooltip>
          ))}
        </div>
        <div className="mx-2 h-6 w-px bg-meeting-border" />
        <div className="flex items-center gap-1">
          {COLORS.map((c) => (
            <button key={c} onClick={() => setColor(c)}
              className={`h-6 w-6 rounded-full border-2 transition-transform ${color === c ? "scale-125 border-primary" : "border-meeting-border"}`}
              style={{ backgroundColor: c }} />
          ))}
        </div>
        <div className="mx-2 h-6 w-px bg-meeting-border" />
        <div className="flex w-24 items-center gap-2">
          <Slider value={[strokeWidth]} min={1} max={12} step={1} onValueChange={([v]) => setStrokeWidth(v)} className="w-full" />
        </div>
        <div className="mx-2 h-6 w-px bg-meeting-border" />
        <Tooltip><TooltipTrigger asChild>
          <Button variant="ghost" size="sm" onClick={undo} className="h-8 w-8 p-0 text-meeting-text hover:bg-meeting-card"><Undo2 className="h-4 w-4" /></Button>
        </TooltipTrigger><TooltipContent>Undo</TooltipContent></Tooltip>
        <Tooltip><TooltipTrigger asChild>
          <Button variant="ghost" size="sm" onClick={redo} className="h-8 w-8 p-0 text-meeting-text hover:bg-meeting-card"><Redo2 className="h-4 w-4" /></Button>
        </TooltipTrigger><TooltipContent>Redo</TooltipContent></Tooltip>
        <Tooltip><TooltipTrigger asChild>
          <Button variant="ghost" size="sm" onClick={clearAll} className="h-8 w-8 p-0 text-meeting-text hover:bg-meeting-card"><Trash2 className="h-4 w-4" /></Button>
        </TooltipTrigger><TooltipContent>Clear All</TooltipContent></Tooltip>
        <Tooltip><TooltipTrigger asChild>
          <Button variant="ghost" size="sm" onClick={downloadCanvas} className="h-8 w-8 p-0 text-meeting-text hover:bg-meeting-card"><Download className="h-4 w-4" /></Button>
        </TooltipTrigger><TooltipContent>Download</TooltipContent></Tooltip>
        <div className="flex-1" />
        <Badge variant="secondary" className="gap-1">
          <Users className="h-3 w-3" />
          {collaborators} editing
        </Badge>
        <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0 text-meeting-text hover:bg-meeting-card"><X className="h-4 w-4" /></Button>
      </div>
      <div ref={containerRef} className="flex-1 cursor-crosshair overflow-hidden">
        <canvas ref={canvasRef} onMouseDown={handleMouseDown} onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp} className="h-full w-full" />
      </div>
    </div>
  );
}
