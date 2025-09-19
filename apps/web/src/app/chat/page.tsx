"use client";
import "katex/dist/katex.min.css";
import { useState, useEffect, useRef } from "react";
import { chatWithSyllabus, Message } from "@/ai/flows/chat-with-syllabus";
import { generateModuleTasks } from "@/ai/flows/generate-module-tasks";
import DesktopChatLayout from "./DesktopChatLayout";
import DesktopChat from "./DesktopChat/DesktopChat";
import MobileChatPanels from "./mobileChatPanels";
import styles from './page.module.css';

export default function ChatComponent() {
  // Client-only state for module title/content
  const [moduleTitle, setModuleTitle] = useState("Loading title...");
  const [moduleContent, setModuleContent] = useState("");

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [copiedMessageIndex, setCopiedMessageIndex] = useState<number | null>(
    null
  );
  const [selectedModel, setSelectedModel] = useState("llama3-8b-8192"); // default model

  const [chatHistory, setChatHistory] = useState<
    { title: string; messages: Message[] }[]
  >([]);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<"ai" | "quick" | "history">("ai");
  const [historyViewing, setHistoryViewing] = useState<boolean>(false);

  const quickQuestions = [
    "Why do I need to study this?",
    "What is the purpose of this module?",
    "How can I apply this in real life?",
  ];

  // === CLIENT-ONLY: read search params ===
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const title = params.get("title") || "Untitled Module";
    const content = params.get("content") || "";
    setModuleTitle(title);
    setModuleContent(content);
  }, []);

  // Scroll to bottom
  useEffect(() => {
    setTimeout(
      () => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }),
      100
    );
  }, [messages, loading]);

  useEffect(() => {
    console.log(messages)
  }, [messages])

  // Generate initial tasks
  useEffect(() => {
    if (!moduleContent || moduleTitle === "Loading title...") return;

    const systemMessage: Message = {
      role: "system",
      content: `You are an expert assistant for the course module: ${moduleTitle}.\nModule Content:\n${moduleContent}`,
    };

    setMessages([systemMessage]);
    setLoading(true);
    setError(null);

    generateModuleTasks({ moduleContent, moduleTitle })
      .then((result) => {
        setMessages([
          systemMessage,
          { role: "assistant", content: result.introductoryMessage },
        ]);
        setSuggestions(result.suggestions);
      })
      .catch(() =>
        setError("Failed to generate initial tasks and applications.")
      )
      .finally(() => setLoading(false));
  }, [moduleContent, moduleTitle]);

  const copyToClipboard = async (text: string, messageIndex: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedMessageIndex(messageIndex);
      setTimeout(() => setCopiedMessageIndex(null), 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  const handleSuggestionClick = (text: string) => {
    setInput(text);
    setTimeout(
      () => document.getElementById("chat-submit-button")?.click(),
      50
    );
  };

  const handleDeleteTopic = (idx: number) => {
    setChatHistory((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = { role: "user", content: input };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput("");
    setSuggestions([]);
    setLoading(true);
    setError(null);

    try {
      const chatHistoryForApi = updatedMessages.filter(
        (m): m is { role: "user" | "assistant"; content: string } =>
          m.role !== "system"
      );

      const result = await chatWithSyllabus({
        history: chatHistoryForApi,
        message: input,
        model: selectedModel, // ✅ Correct model usage
      });

      const assistantMessage: Message = {
        role: "assistant",
        content: result.response,
      };

      setMessages((msgs) => [...msgs, assistantMessage]);
      setSuggestions(result.suggestions || []);
    } catch (err) {
      console.error("Error getting AI response:", err);
      setError("Sorry, something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleNewTopic = () => {
    const firstUserMessage =
      messages.find((m) => m.role === "user")?.content || "";

    if (historyViewing) {
      // Just exit history mode + clear messages
      setHistoryViewing(false);
      setMessages([]);
      return; // stop here, don’t archive old chat
    }

    // Normal behavior (not in history view)
    if (messages.length > 1) {
      setChatHistory((prev) => [
        ...prev,
        {
          title: firstUserMessage
            ? `Untitled - ${firstUserMessage.slice(0, 20)}`
            : `${moduleTitle} - New Topic`,
          messages: messages.filter((m) => m.role !== "system"),
        },
      ]);
    }
    const systemMessage: Message = {
      role: "system",
      content: `You are an expert assistant for the course module: ${moduleTitle}.\nModule Content:\n${moduleContent}`,
    };

    setMessages([systemMessage]);
    setInput("");
    setSuggestions([]);
    setError(null);
    setActiveTab("ai");
  };

  return (
    <div className={styles.container}>


      <div className={styles.desktopContainer}>
        {/* <DesktopChatLayout
          moduleTitle={moduleTitle}
          moduleContent={moduleContent}
          messages={messages}
          chatHistory={chatHistory}
          suggestions={suggestions}
          quickQuestions={quickQuestions}
          input={input}
          setInput={setInput}
          onDeleteTopic={handleDeleteTopic}
          loading={loading}
          onModelChange={setSelectedModel}
          copiedMessageIndex={copiedMessageIndex}
          handleSend={handleSend}
          handleNewTopic={handleNewTopic}
          handleSuggestionClick={handleSuggestionClick}
          copyToClipboard={copyToClipboard}
          setMessages={setMessages}
        /> */}
        <DesktopChat
          chatHistory={chatHistory}
          onDeleteTopic={handleDeleteTopic}
          moduleTitle={moduleTitle}
          messages={messages}
          copiedMessageIndex={copiedMessageIndex}
          copyToClipboard={copyToClipboard}
          loading={loading}
          suggestions={suggestions}
          handleSend={handleSend}
          handleSuggestionClick={handleSuggestionClick}
          input={input}
          setInput={setInput}
          onModelChange={setSelectedModel}
          handleNewTopic={handleNewTopic}
          setMessages={setMessages}
          setActiveTab={setActiveTab}
          historyViewing={historyViewing}
          setHistoryViewing={setHistoryViewing}
        />


      </div>

      <div className={styles.mobileContainer}>
        <MobileChatPanels
          messages={messages}
          onModelChange={setSelectedModel}
          setMessages={setMessages}
          input={input}
          setInput={setInput}
          loading={loading}
          error={error}
          suggestions={suggestions}
          copiedMessageIndex={copiedMessageIndex}
          chatHistory={chatHistory}
          setChatHistory={setChatHistory}
          quickQuestions={quickQuestions}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          chatEndRef={chatEndRef}
          moduleTitle={moduleTitle}
          copyToClipboard={copyToClipboard}
          handleSuggestionClick={handleSuggestionClick}
          handleSend={handleSend}
          handleNewTopic={handleNewTopic}
        />
      </div>
    </div>
  );
}
