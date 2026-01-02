'use client';

import { useState } from 'react';
import VoiceAssistant from '@/app/components/VoiceAssistant';

type FloatingAssistantProps = {
  lessonId: number;
  lessonTitle?: string;
  courseTitle?: string;
};

export default function FloatingAssistant({
  lessonId,
  lessonTitle,
  courseTitle,
}: FloatingAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="assistant-float">
      {isOpen && (
        <div className="assistant-panel" role="dialog" aria-label="Asistente de voz">
          <div className="assistant-panel__header">
            <div className="assistant-panel__title">Asistente</div>
            <button
              type="button"
              className="assistant-panel__close"
              onClick={() => setIsOpen(false)}
              aria-label="Cerrar asistente"
            >
              ×
            </button>
          </div>
          <div className="assistant-panel__body">
            <VoiceAssistant
              lessonId={lessonId}
              lessonTitle={lessonTitle}
              courseTitle={courseTitle}
            />
          </div>
        </div>
      )}

      <button
        type="button"
        className={`assistant-fab${isOpen ? ' assistant-fab--open' : ''}`}
        onClick={() => setIsOpen(prev => !prev)}
        aria-label={isOpen ? 'Cerrar asistente' : 'Abrir asistente'}
      >
        <span className="assistant-fab__icon" aria-hidden="true">
          <svg
            width="26"
            height="26"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M7.5 17.25H10.5L13.75 20V17.25H16.5C18.1569 17.25 19.5 15.9069 19.5 14.25V7.5C19.5 5.84315 18.1569 4.5 16.5 4.5H7.5C5.84315 4.5 4.5 5.84315 4.5 7.5V14.25C4.5 15.9069 5.84315 17.25 7.5 17.25Z"
              fill="currentColor"
            />
            <path
              d="M8.5 10.5H15.5"
              stroke="#ffffff"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          </svg>
        </span>
      </button>
    </div>
  );
}
