import styles from './ChatHistory.module.css';
import { Message } from '../../../types';
import React, { useState } from 'react';
import { FiMessageSquare } from "react-icons/fi";
import { RiDeleteBin6Line } from "react-icons/ri";
import { Button } from "@/components/ui/button";
import { TbLayoutSidebarRightExpand } from "react-icons/tb";
import { TbLayoutSidebarLeftExpand } from "react-icons/tb";

interface Props {
    chatHistory: { title: string; messages: Message[] }[];
    onDeleteTopic: (index: number) => void;
    handleNewTopic: () => void;
    setActiveTab: React.Dispatch<React.SetStateAction<"ai" | "quick" | "history">>;
    setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
    historyViewing: boolean;
    setHistoryViewing: React.Dispatch<React.SetStateAction<boolean>>;
}


const ChatHistory: React.FC<Props> = ({
    chatHistory,
    onDeleteTopic,
    handleNewTopic,
    setActiveTab,
    setMessages,
    historyViewing,
    setHistoryViewing
}) => {

    const [visible, setVisible] = useState(true);
    const expandFunction = () => {
        setVisible(!visible);
    }

    return (
        <>
            {visible && (
                <div className={styles.container}>

                    <>
                        <div className={styles.header}>
                            <div className={styles.headerInnerContainer}>
                                <FiMessageSquare size={25} />
                                <span> Chat History</span>
                            </div>

                            <TbLayoutSidebarLeftExpand onClick={expandFunction} />
                        </div>

                        <Button variant="outline" className="mb-4" onClick={handleNewTopic}>
                            + New Topic
                        </Button>

                        {chatHistory.length === 0 ? (
                            <p>
                                No previous topics
                            </p>
                        ) : (
                            chatHistory.map((topic, idx) => (
                                <div
                                    key={idx}
                                    className={styles.historyItem}
                                >
                                    <span
                                        className={styles.historyName}
                                        onClick={() => {
                                            setHistoryViewing(true);
                                            setMessages(topic.messages);
                                            setActiveTab("ai");
                                        }}>
                                        {topic.title}
                                    </span>
                                    <RiDeleteBin6Line
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onDeleteTopic(idx);
                                        }}
                                        className={styles.deleteIcon}
                                    />


                                </div>
                            ))
                        )}
                    </>

                </div>
            )}

            {visible === false && (
                <div className={styles.closedContainer}>
                    <div className={styles.header}>
                        <TbLayoutSidebarRightExpand onClick={expandFunction} />
                    </div>
                </div>
            )}
        </>
    );
};

export default ChatHistory;