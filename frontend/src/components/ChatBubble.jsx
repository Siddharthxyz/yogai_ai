import { motion } from "framer-motion";
import { Bot, User } from "lucide-react";
import { cn } from "./ui";

/**
 * ChatBubble — renders a single chat message
 * @param {"user"|"assistant"} role
 * @param {string} content
 * @param {string} timestamp  — optional ISO string or formatted time
 * @param {boolean} isLoading — show typing indicator instead of content
 */
export default function ChatBubble({ role, content, timestamp, isLoading = false }) {
  const isUser = role === "user";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn("flex items-end gap-3", isUser ? "flex-row-reverse" : "flex-row")}
    >
      {/* Avatar */}
      <div
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-2xl",
          isUser
            ? "bg-gradient-to-br from-primary-400 to-cyan-300 text-slate-950"
            : "bg-white/10 border border-white/10 text-slate-300"
        )}
      >
        {isUser ? <User size={14} /> : <Bot size={14} />}
      </div>

      {/* Bubble */}
      <div
        className={cn(
          "max-w-[75%] rounded-3xl px-4 py-3 text-sm leading-6",
          isUser
            ? "rounded-br-lg bg-gradient-to-br from-primary-500/80 to-cyan-500/60 text-white"
            : "rounded-bl-lg bg-white/8 border border-white/10 text-slate-200"
        )}
      >
        {isLoading ? (
          <TypingIndicator />
        ) : (
          <p className="whitespace-pre-wrap">{content}</p>
        )}
        {timestamp && !isLoading && (
          <p
            className={cn(
              "mt-1.5 text-[10px] uppercase tracking-[0.18em]",
              isUser ? "text-cyan-100/60 text-right" : "text-slate-500"
            )}
          >
            {timestamp}
          </p>
        )}
      </div>
    </motion.div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 py-1">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="h-2 w-2 rounded-full bg-slate-400"
          animate={{ scale: [1, 1.4, 1], opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.18 }}
        />
      ))}
    </div>
  );
}

/**
 * ChatHistory — renders a scrollable list of ChatBubbles
 * @param {Array<{role, content, timestamp}>} messages
 * @param {boolean} isLoading
 */
export function ChatHistory({ messages = [], isLoading = false }) {
  return (
    <div className="flex flex-col gap-4 overflow-y-auto">
      {messages.length === 0 && !isLoading && (
        <div className="flex flex-col items-center gap-3 py-8 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-white/6 text-slate-500">
            <Bot size={24} />
          </div>
          <p className="text-sm text-slate-400">
            Ask your AI kitchen assistant anything — recipes, substitutions, macros.
          </p>
        </div>
      )}
      {messages.map((msg, index) => (
        <ChatBubble
          key={`${msg.role}-${index}`}
          role={msg.role}
          content={msg.content}
          timestamp={msg.timestamp}
        />
      ))}
      {isLoading && <ChatBubble role="assistant" isLoading />}
    </div>
  );
}
