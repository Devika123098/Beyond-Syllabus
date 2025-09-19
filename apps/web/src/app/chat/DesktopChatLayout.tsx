"use client";
import "katex/dist/katex.min.css";
import React, { useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Loader2,
  Send,
  Copy,
  Check,
  User,
  Sparkles,
  Menu,
  PlusIcon,
  ChevronLeft,
  ChevronRight,
  Brain,
  X,
  Music,
  Map,
  Speaker,
  MessageCircle,
} from "lucide-react";
import ModelSelector from "@/components/common/ModelSelector/ModelSelector";

interface Message {
  role: "system" | "user" | "assistant";
  content: string;
}

interface DesktopChatLayoutProps {
  moduleTitle: string;
  onModelChange: (modelId: string) => void;
  moduleContent: string;
  messages: Message[];
  chatHistory: { title: string; messages: Message[] }[];
  suggestions: string[];
  quickQuestions: string[];
  input: string;
  loading: boolean;
  error?: string;
  copiedMessageIndex: number | null;
  onDeleteTopic: (index: number) => void;
  handleSend: () => void;
  handleNewTopic: () => void;
  handleSuggestionClick: (text: string) => void;
  setInput: (val: string) => void;
  copyToClipboard: (content: string, idx: number) => void;
  setMessages: (messages: Message[]) => void;
}

export default function DesktopChatLayout({
  moduleTitle,
  onDeleteTopic,
  moduleContent,
  onModelChange,
  messages,
  chatHistory,
  suggestions,
  quickQuestions,
  input,
  loading,
  error,
  copiedMessageIndex,
  handleSend,
  handleNewTopic,
  handleSuggestionClick,
  setInput,
  copyToClipboard,
  setMessages,
}: DesktopChatLayoutProps) {
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Visibility toggles for the two edge columns
  const [leftVisible, setLeftVisible] = useState(true);
  const [rightVisible, setRightVisible] = useState(true);

  // compute middle column width class to keep your desktop layout proportions
  const getMiddleWidthClass = () => {
    if (rightVisible) return "w-[80%]";
    if (!rightVisible && !leftVisible) return "w-full";
  };
  const features = [
    {
      name: "Audio Overview",
      icon: <Music className="h-6 w-6 text-primary" />,
    },
    { name: "Module Mindmap", icon: <Map className="h-6 w-6 text-primary" /> },
    {
      name: "Text-to-Speech",
      icon: <Speaker className="h-6 w-6 text-primary" />,
    },
    {
      name: "Voice Chat",
      icon: <MessageCircle className="h-6 w-6 text-primary" />,
    },
  ];

  // Track which cards are clicked
  const [clicked, setClicked] = useState<boolean[]>(
    Array(features.length).fill(false)
  );

  const handleClick = (index: number) => {
    const updated = [...clicked];
    updated[index] = true; // mark clicked
    setClicked(updated);
  };

  return (
    <>
      {/* Left Column: Chat History OR small opener */}
      {leftVisible ? (
        <div className="flex w-[16%] flex-col border-2 h-full dark:bg-background bg-black/10 border-white/20 p-3 rounded-l-2xl">
          <div className="flex justify-end mb-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLeftVisible(false)}
              aria-label="Hide chat history"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <Button variant="outline" className="mb-4" onClick={handleNewTopic}>
            + New Topic
          </Button>
          <div className="flex-1 overflow-y-auto">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold">Chat History</h3>
            </div>
            {chatHistory.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                No previous topics
              </p>
            ) : (
              chatHistory.map((topic, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between gap-2"
                >
                  <span 
                  className="text-xs text-muted-foreground">
                    {topic.title}
                  </span>
                  <button
                    className="text-red-500 text-xs ml-2 hover:underline"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteTopic(idx); // ✅ actually deletes now
                    }}
                  >
                    Delete
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      ) : (
        // small visible tab to re-open left column
        <div className="flex items-start">
          <div className="flex h-full items-center px-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLeftVisible(true)}
              aria-label="Open chat history"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Middle Column: Chat */}
      <div
        className={`${getMiddleWidthClass()} flex flex-col h-full overflow-y-auto pr-4 border-2 border-white/20 -mr-4 px-5 space-y-6 scrollbar-thin scrollbar-thumb-gray-500 scrollbar-track-transparent `}
      >
        <h1 className="border-b-2 border-primary text-lg pb-10 md:text-xl pt-5 font-bold text-center text-foreground truncate">
          <span className="text-primary">{moduleTitle}</span>
        </h1>

        <div className="flex-1 pr-4 -mr-4 space-y-6 ">
          <AnimatePresence>
            {messages
              .filter((m) => m.role !== "system")
              .map((msg, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className={`flex items-start gap-3 w-full ${msg.role === "user" ? "justify-end" : "justify-start"
                    }`}
                >
                  {msg.role === "assistant" && (
                    <Avatar className="w-8 h-8 border">
                      <AvatarFallback className="bg-primary/10">
                        <Sparkles className="h-4 w-4 text-primary" />
                      </AvatarFallback>
                    </Avatar>
                  )}
                  {msg.content ? (
                    <div className="relative  group max-w-md md:max-w-lg">
                      <div
                        className={`rounded-2xl px-4 py-3 text-base shadow-md prose prose-sm dark:prose-invert  bg-black/10 prose-headings:font-semibold prose-p:my-2 prose-ul:my-2 prose-li:my-0.5 ${msg.role === "user"
                            ? "bg-primary text-primary-foreground rounded-br-none"
                            : "text-card-foreground rounded-bl-none border"
                          }`}
                      >
                        <ReactMarkdown
                          remarkPlugins={[remarkMath, remarkGfm]}
                          rehypePlugins={[rehypeKatex]}
                        >
                          {msg.content}
                        </ReactMarkdown>
                      </div>
                      {msg.role === "assistant" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="absolute -bottom-7 hover:bg-white/0 hover:text-green-600 transition-opacity bg-background h-8 w-8 p-0 z-10"
                          onClick={() => copyToClipboard(msg.content, idx)}
                          aria-label="Copy response"
                        >
                          {copiedMessageIndex === idx ? (
                            <Check className="h-4 w-4 text-green-600" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-muted-foreground bg-black/50 rounded-2xl px-4 py-3 border shadow-md">
                      <Loader2 className="h-5 w-5 animate-spin" /> Thinking...
                    </div>
                  )}
                  {msg.role === "user" && (
                    <Avatar className="w-8 h-8">
                      <AvatarFallback>
                        <User className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                  )}
                </motion.div>
              ))}
          </AnimatePresence>

          {loading && messages[messages.length - 1]?.role === "user" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-start items-center gap-3"
            >
              <Avatar className="w-8 h-8">
                <AvatarFallback className="bg-primary/10">
                  <Sparkles className="h-4 w-4 text-primary" />
                </AvatarFallback>
              </Avatar>
              <div className="flex items-center gap-2 text-muted-foreground bg-black/50 rounded-2xl px-4 py-3 shadow-md">
                <Loader2 className="h-5 w-5 animate-spin" /> Thinking...
              </div>
            </motion.div>
          )}

          {error && <div className="text-destructive py-4">{error}</div>}
          <div ref={chatEndRef} />
        </div>

        {/* Suggestions & Input */}
        {suggestions.length > 0 && !loading && (
          <div className="flex flex-wrap gap-2 mb-2 md:w-full">
            <p className="flex items-center gap-1 text-sm font-semibold">
              <Menu size={16} /> Related
            </p>
            {suggestions.map((s, i) => (
              <div
                key={`suggestion-${i}`}
                className="flex items-center justify-between w-full border-b-[0.8px]"
              >
                <Button
                  className="w-[350px] md:w-full text-wrap flex bg-transparent hover:text-purple-600 hover:bg-transparent text-left md:h-[7vh] h-[10vh] text-[12px] md:text-[13px] text-black dark:text-white justify-start rounded"
                  size="sm"
                  onClick={() => handleSuggestionClick(s)}
                >
                  {s}
                </Button>
                <PlusIcon size={20} className="text-purple-500" />
              </div>
            ))}
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex gap-2 w-full p-2 rounded-[35px] shadow-lg border"
        >
          <input
            className="flex-1 bg-transparent border-none rounded-lg px-3 py-2 text-base text-foreground placeholder:text-muted-foreground/80 focus:outline-none focus:ring-0 disabled:opacity-70 text-[.7rem]"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask the AI about this module..."
            disabled={loading}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
          />
          <Button
            id="chat-submit-button"
            type="submit"
            size="icon"
            disabled={loading || !input.trim()}
            className="rounded-xl w-12 h-12 flex-shrink-0"
            aria-label="Send message"
          >
            <Send className="h-5 w-5" />
          </Button>
        </form>
      </div>

      {/* Right Column: Features + Quick Questions OR small opener */}
      {rightVisible ? (
        <div className="flex w-[24%] dark:bg-background bg-black/10  rounded-r-2xl flex-col border-2 h-full  border-white/20">
          <div className="flex justify-start p-3 ">
            {/* small toggle to hide right column */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setRightVisible(false)}
              aria-label="Hide features"
            >
              <Menu className="h-4 w-4" />
            </Button>
          </div>
          {/* Feature Cards */}
          <div className="grid grid-cols-2 grid-rows-2 px-[10px] gap-2">
            {features.map((feature, i) => (
              <div
                key={`feature-${i}`}
                className="relative bg-black/10 hover:bg-accent transition-all duration-300 ease border backdrop-blur-md rounded-xl shadow-lg justify-center h-[90px] flex flex-col items-center p-2 cursor-pointer w-[100px] max-[990px]:w-[80px] max-[860px]:font-[12px]"
                onClick={() => handleClick(i)}
              >
                {/* Icon */}
                <div className="mb-2">{feature.icon}</div>

                {/* Text */}
                <p className="text-sm font-semibold text-center text-foreground">
                  {clicked[i] ? "Coming Soon" : feature.name}
                </p>
              </div>
            ))}
          </div>
          <ModelSelector onModelChange={onModelChange} />
          {/* Quick Questions */}
          <div className="flex text-wrap flex-col gap-2 p-3 rounded-xl  w-full h-fit  z-40">
            <p className="text-sm font-semibold flex items-center gap-1">
              <Brain size={16} /> Quick Questions
            </p>
            {quickQuestions.map((q, i) => (
              <Button
                key={`quick-${i}`}
                variant="ghost"
                className="justify-start text-left border-purple-900 border-[1px] dark:border text-[13px] hover:text-purple-600 w-fit text-wrap"
                onClick={() => handleSuggestionClick(q)}
              >
                {q}
              </Button>
            ))}
          </div>
        </div>
      ) : (
        // small visible tab to re-open right column
        <div className="flex items-start">
          <div className="flex h-full items-center px-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setRightVisible(true)}
              aria-label="Open features"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
