'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';

type Message = {
  role: 'user' | 'assistant';
  content: string;
};

type VoiceAssistantProps = {
  lessonId: number;
  lessonTitle?: string;
  courseTitle?: string;
};

const MAX_HISTORY = 10;
const INPUT_LIMIT = 1200;

export default function VoiceAssistant({ lessonId, lessonTitle, courseTitle }: VoiceAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content:
        'Hola. Soy tu asistente de ingles. Preguntame lo que necesites: explicaciones, practica o ejemplos.',
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);
  const [voiceReplies, setVoiceReplies] = useState(true);
  const [ttsError, setTtsError] = useState<string | null>(null);
  const messagesRef = useRef<Message[]>(messages);
  const recognitionRef = useRef<any>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null);
  const renderTaggedText = (text: string) => {
    const nodes: React.ReactNode[] = [];
    const regex = /<en>(.*?)<\/en>/g;
    let lastIndex = 0;
    let match: RegExpExecArray | null;
    let key = 0;
    while ((match = regex.exec(text)) !== null) {
      const before = text.slice(lastIndex, match.index);
      if (before) {
        nodes.push(<span key={`text-${key++}`}>{before}</span>);
      }
      const english = match[1];
      if (english) {
        nodes.push(
          <strong key={`en-${key++}`} style={{ fontWeight: 700 }}>
            {english}
          </strong>,
        );
      }
      lastIndex = match.index + match[0].length;
    }
    const tail = text.slice(lastIndex);
    if (tail) {
      nodes.push(<span key={`tail-${key++}`}>{tail}</span>);
    }
    return nodes.length > 0 ? nodes : text;
  };

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, isLoading]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const Recognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!Recognition) {
      setSpeechSupported(false);
      return;
    }

    const recognition = new Recognition();
    recognition.lang = 'es-ES';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onresult = (event: any) => {
      const transcript = event.results?.[0]?.[0]?.transcript?.trim() || '';
      if (transcript) {
        handleSend(transcript);
      }
    };
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);
    recognitionRef.current = recognition;

    return () => {
      recognition.abort();
    };
  }, []);

  useEffect(() => {
    return () => {
      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current);
      }
    };
  }, []);

  const speak = useCallback(
    async (text: string) => {
      if (!voiceReplies) return;
      setTtsError(null);
      try {
        const segments: Array<{ text: string; voice: 'nova' | 'alloy' }> = [];
        const regex = /<en>(.*?)<\/en>/g;
        let lastIndex = 0;
        let match: RegExpExecArray | null;
        while ((match = regex.exec(text)) !== null) {
          const before = text.slice(lastIndex, match.index).trim();
          if (before) {
            segments.push({ text: before, voice: 'nova' });
          }
          const english = match[1].trim();
          if (english) {
            segments.push({ text: english, voice: 'alloy' });
          }
          lastIndex = match.index + match[0].length;
        }
        const tail = text.slice(lastIndex).trim();
        if (tail) {
          segments.push({ text: tail, voice: 'nova' });
        }

        if (segments.length === 0) return;

        const urls = await Promise.all(
          segments.map(async segment => {
            const res = await fetch('/uploader/api/tts', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                text: segment.text,
                voice: segment.voice,
              }),
            });

            if (!res.ok) {
              const data = await res.json().catch(() => ({}));
              throw new Error(data?.error || 'No se pudo generar audio.');
            }

            const blob = await res.blob();
            return URL.createObjectURL(blob);
          }),
        );

        for (const url of urls) {
          if (audioUrlRef.current) {
            URL.revokeObjectURL(audioUrlRef.current);
          }
          audioUrlRef.current = url;

          if (!audioRef.current) {
            audioRef.current = new Audio();
          }
          audioRef.current.src = url;
          await audioRef.current.play();
          await new Promise(resolve => {
            const audio = audioRef.current;
            if (!audio) return resolve(null);
            audio.onended = () => resolve(null);
          });
        }
      } catch (err: any) {
        setTtsError(err?.message || String(err));
      }
    },
    [voiceReplies],
  );

  const handleSend = useCallback(
    async (override?: string) => {
      const content = (override ?? input).trim();
      if (!content || isLoading || !Number.isFinite(lessonId)) return;
      if (content.length > INPUT_LIMIT) {
        setError(`Max ${INPUT_LIMIT} caracteres.`);
        return;
      }
      setError(null);
      setIsLoading(true);
      setInput('');

      const nextMessages: Message[] = [
        ...messagesRef.current,
        { role: 'user', content },
      ];
      setMessages(nextMessages);

      const payloadMessages = nextMessages.slice(-MAX_HISTORY);

      try {
        const res = await fetch('/uploader/api/assistant', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            lessonId,
            messages: payloadMessages,
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data?.error || 'No se pudo responder.');
        }

        const reply = String(data?.reply || '').trim();
        if (!reply) {
          throw new Error('Respuesta vacia del asistente.');
        }

        setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
        void speak(reply);
      } catch (err: any) {
        const message = err?.message || String(err);
        setError(message);
        setMessages(prev => [
          ...prev,
          {
            role: 'assistant',
            content: 'Lo siento, hubo un problema al responder. Intentalo de nuevo.',
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    },
    [input, isLoading, lessonId, speak],
  );

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  const handleToggleListening = () => {
    const recognition = recognitionRef.current;
    if (!recognition) return;
    if (isListening) {
      recognition.stop();
      return;
    }
    try {
      recognition.start();
      setIsListening(true);
    } catch (err) {
      setIsListening(false);
    }
  };

  return (
    <div className="assistant-card">
      <div className="assistant-header">
        <div>
          <div className="assistant-title">Asistente de voz</div>
          <div className="assistant-subtitle">
            {lessonTitle ? `Leccion: ${lessonTitle}` : 'Practica tu ingles en voz alta.'}
            {courseTitle ? ` • Curso: ${courseTitle}` : ''}
          </div>
        </div>
        <button
          type="button"
          className="ui-button ui-button-outline assistant-clear"
          onClick={() =>
            setMessages([
              {
                role: 'assistant',
                content:
                  'Listo. Empecemos otra vez. Dime que quieres practicar o preguntar.',
              },
            ])
          }
        >
          Limpiar
        </button>
      </div>

      <div className="assistant-messages" role="log" aria-live="polite">
        {messages.map((message, index) => (
          <div
            key={`${message.role}-${index}`}
            className={`assistant-message assistant-message--${message.role}`}
          >
            <div className="assistant-message__role">
              {message.role === 'user' ? 'Tu' : 'Tutor'}
            </div>
            <div className="assistant-message__content">
              {renderTaggedText(message.content)}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="assistant-message assistant-message--assistant">
            <div className="assistant-message__role">Tutor</div>
            <div className="assistant-message__content">Pensando...</div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {error && <div className="assistant-error">{error}</div>}
      {ttsError && <div className="assistant-error">{ttsError}</div>}

      <div className="assistant-controls">
        <label className="assistant-toggle">
          <input
            type="checkbox"
            checked={voiceReplies}
            onChange={event => setVoiceReplies(event.target.checked)}
          />
          <span>Voz en respuestas</span>
        </label>
        <div className="assistant-hint">
          {speechSupported ? '.' : 'Microfono no soportado.'}
        </div>
      </div>

      <div className="assistant-input">
        <textarea
          value={input}
          onChange={event => setInput(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Escribe o usa el microfono para preguntar..."
          rows={2}
          className="ui-textarea"
        />
        <div className="assistant-actions">
          <button
            type="button"
            className={`ui-button ui-button-secondary assistant-mic${isListening ? ' assistant-mic--active' : ''}`}
            onClick={handleToggleListening}
            disabled={!speechSupported}
            aria-label={isListening ? 'Detener microfono' : 'Activar microfono'}
          >
            {isListening ? (
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                aria-hidden="true"
                focusable="false"
                style={{ display: 'block' }}
              >
                <rect x="7" y="6" width="10" height="12" rx="3" fill="currentColor" />
                <rect x="5" y="3" width="14" height="2" rx="1" fill="currentColor" />
              </svg>
            ) : (
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                aria-hidden="true"
                focusable="false"
                style={{ display: 'block' }}
              >
                <path
                  d="M12 3c1.66 0 3 1.34 3 3v6a3 3 0 1 1-6 0V6c0-1.66 1.34-3 3-3Z"
                  fill="currentColor"
                />
                <path
                  d="M6 12a6 6 0 0 0 12 0h2a8 8 0 0 1-16 0h2Z"
                  fill="currentColor"
                />
                <rect x="11" y="18" width="2" height="3" fill="currentColor" />
              </svg>
            )}
          </button>
          <button
            type="button"
            className="ui-button ui-button-primary"
            onClick={() => handleSend()}
            disabled={isLoading}
            aria-label="Enviar mensaje"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              aria-hidden="true"
              focusable="false"
              style={{ display: 'block' }}
            >
              <path
                d="M3.5 11.5 20.5 4.5 13.5 21.5 11.5 13.5 3.5 11.5Z"
                fill="currentColor"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
