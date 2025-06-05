import React from 'react';
import '../styles/LessonCard.css';
import { FaLock, FaCheck, FaPlay } from 'react-icons/fa';

interface LessonCardProps {
    id: number;
    title: string;
    description: string;
    isCompleted: boolean;
    isLocked: boolean;
    onStart: () => void;
}

const LessonCard: React.FC<LessonCardProps> = ({
    id,
    title,
    description,
    isCompleted,
    isLocked,
    onStart
}) => {
    return (
        <div className={`lesson-card ${isCompleted ? 'completed' : ''} ${isLocked ? 'locked' : ''}`}>
            <div className="lesson-number">{id}</div>
            <h3 className="lesson-title">{title}</h3>
            <p className="lesson-description">{description}</p>
            <button 
                className="lesson-button"
                onClick={onStart}
                disabled={isLocked}
            >
                {isLocked ? (
                    <FaLock />
                ) : isCompleted ? (
                    <FaCheck />
                ) : (
                    <FaPlay />
                )}
                <span>
                    {isLocked ? 'Locked' : isCompleted ? 'Practice Again' : 'Start Lesson'}
                </span>
            </button>
        </div>
    );
};

export default LessonCard; 