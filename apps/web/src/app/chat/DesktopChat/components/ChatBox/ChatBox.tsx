import React, { useRef } from 'react';
import styles from './ChatBox.module.css';
import { AnimatePresence, motion } from 'framer-motion';
import { Message } from '../../../types';
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
    Sparkles,
    Loader2,
    Send,
    Copy,
    Check,
    User,
    Menu,
    PlusIcon,
} from "lucide-react";
import rehypeKatex from "rehype-katex";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import remarkGfm from "remark-gfm";
import { Button } from "@/components/ui/button";

interface Props {
    moduleTitle: string;
    messages: Message[];
    copiedMessageIndex: number | null;
    copyToClipboard: (content: string, idx: number) => void;
    loading: boolean;
    suggestions: string[];
    handleSuggestionClick: (text: string) => void;
    handleSend: () => void;
    input: string;
    setInput: (val: string) => void;
    error?: string;

}

const ChatBox: React.FC<Props> = ({
    moduleTitle,
    messages,
    copiedMessageIndex,
    copyToClipboard,
    loading,
    suggestions,
    handleSuggestionClick,
    handleSend,
    input,
    setInput,
    error,
}) => {
    const chatEndRef = useRef<HTMLDivElement>(null);
    return (
        <div className={styles.container}>
            <div className={styles.header}>
                {moduleTitle}
            </div>

            <div className={styles.chatArea}>
                <div className={styles.allMessagesContainer}>
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
                                    className={`${styles.messageFinalContainer} ${msg.role === "user" ? styles.user : styles.other}`}
                                >
                                    {msg.role === "assistant" && (
                                        <Avatar className={styles.avatarIcon}>
                                            <AvatarFallback className="bg-primary/10">
                                                <Sparkles className="h-4 w-4 text-primary" />
                                            </AvatarFallback>
                                        </Avatar>
                                    )}
                                    {msg.content ? (
                                        <div className={styles.messageContainer}>
                                            <div
                                                className={`${styles.message} ${msg.role === "user" ? styles.user : styles.other}`}
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
                </div>

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
                className={styles.form}
            >
                <input
                    className={styles.input}
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
    );
};

export default ChatBox;