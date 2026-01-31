import { useState } from "react";
import { X, Send, Smile } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface Message {
  id: string;
  sender: string;
  initials: string;
  content: string;
  timestamp: string;
  isLocal?: boolean;
}

interface ChatPanelProps {
  onClose: () => void;
}

const initialMessages: Message[] = [
  {
    id: "1",
    sender: "Sarah Chen",
    initials: "SC",
    content: "Good morning everyone! Ready to start?",
    timestamp: "10:00 AM",
  },
  {
    id: "2",
    sender: "Alex Johnson",
    initials: "AJ",
    content: "Yes, just finishing up the slides.",
    timestamp: "10:01 AM",
  },
  {
    id: "3",
    sender: "You",
    initials: "YO",
    content: "Perfect, let me know when you're done.",
    timestamp: "10:02 AM",
    isLocal: true,
  },
];

export function ChatPanel({ onClose }: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [newMessage, setNewMessage] = useState("");

  const handleSend = () => {
    if (!newMessage.trim()) return;

    const message: Message = {
      id: Date.now().toString(),
      sender: "You",
      initials: "YO",
      content: newMessage,
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      isLocal: true,
    };

    setMessages([...messages, message]);
    setNewMessage("");
  };

  return (
    <div className="flex h-full w-80 flex-col border-l border-meeting-border bg-meeting-card">
      <div className="flex items-center justify-between border-b border-meeting-border p-4">
        <h3 className="text-lg font-semibold text-meeting-text">Chat</h3>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="h-8 w-8 text-meeting-muted hover:bg-meeting-border hover:text-meeting-text"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1 p-4">
        <div className="flex flex-col gap-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${message.isLocal ? "flex-row-reverse" : ""}`}
            >
              <Avatar className="h-8 w-8 shrink-0">
                <AvatarFallback
                  className={`text-xs ${
                    message.isLocal
                      ? "bg-primary text-primary-foreground"
                      : "bg-meeting-border text-meeting-text"
                  }`}
                >
                  {message.initials}
                </AvatarFallback>
              </Avatar>
              <div
                className={`flex max-w-[200px] flex-col gap-1 ${
                  message.isLocal ? "items-end" : ""
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-meeting-text">
                    {message.sender}
                  </span>
                  <span className="text-xs text-meeting-muted">
                    {message.timestamp}
                  </span>
                </div>
                <p
                  className={`rounded-lg px-3 py-2 text-sm ${
                    message.isLocal
                      ? "bg-primary text-primary-foreground"
                      : "bg-meeting-border text-meeting-text"
                  }`}
                >
                  {message.content}
                </p>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      <div className="border-t border-meeting-border p-4">
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 shrink-0 text-meeting-muted hover:bg-meeting-border hover:text-meeting-text"
          >
            <Smile className="h-5 w-5" />
          </Button>
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Type a message..."
            className="border-meeting-border bg-meeting-bg text-meeting-text placeholder:text-meeting-muted"
          />
          <Button
            onClick={handleSend}
            size="icon"
            className="h-10 w-10 shrink-0"
            disabled={!newMessage.trim()}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
