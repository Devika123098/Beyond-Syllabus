"use client";
import styles from './Sidebar.module.css';
import { GoBook } from "react-icons/go";
import { LuHistory } from "react-icons/lu";
import { FaRegCircleQuestion } from "react-icons/fa6";
import ModelSelector from '@/components/common/ModelSelector/ModelSelector';
import { ThemeToggle } from '@/components/common/ThemeToggle';
import { useRouter } from "next/navigation";

interface Props {
    onModelChange: (modelId: string) => void;
    handleSuggestionClick: (text: string) => void
}
const Sidebar: React.FC<Props> = ({
    onModelChange,
    handleSuggestionClick
}) => {

    const quickQuestions = [
        "Why do I need to study this module?",
        "What is the purpose of this module?",
        "How can I apply this in real life?",
    ];

    const router = useRouter();

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <p onClick={() => router.push('/')} style={{ cursor: 'pointer' }}> Beyond Syllabus </p>
                <ThemeToggle />
            </div>

            <div className={styles.menuContainer}>
                <div className={styles.menuItem}>
                    <GoBook />
                    <span onClick={() => router.push("/select")}> Syllabus </span>
                </div>
                <div className={styles.menuItem}>
                    <LuHistory />
                    <span> History </span>
                </div>
            </div>

            <div className={styles.questionsContainer}>
                <span> Quick Questions </span>
                {quickQuestions.map((q, i) => (
                    <div
                        key={i}
                        className={styles.questionItem}
                        onClick={() => handleSuggestionClick(q)}>
                        <FaRegCircleQuestion />
                        {q}
                    </div>
                ))}
            </div>
            <ModelSelector onModelChange={onModelChange} />
        </div>
    );
};

export default Sidebar;