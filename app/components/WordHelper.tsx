'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';

type WordHelperProps = {
  lessonId?: number;
};

const INPUT_LIMIT = 200;
const CONTEXT_LIMIT = 500;

export default function WordHelper({ lessonId }: WordHelperProps) {
  const [word, setWord] = useState('');
  const [context, setContext] = useState('');
  const [response, setResponse] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);
  const [voiceReplies, setVoiceReplies] = useState(true);
  const [ttsError, setTtsError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);
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
        setContext(prev => (prev ? `${prev}\n${transcript}` : transcript));
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

  useEffect(() => {
    const handleSelection = () => {
      const selection = window.getSelection?.();
      const text = selection?.toString().trim() || '';
      if (!text || text.includes(' ')) return;
      if (text.length > INPUT_LIMIT) return;
      setWord(text);
    };

    document.addEventListener('selectionchange', handleSelection);
    return () => {
      document.removeEventListener('selectionchange', handleSelection);
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

  const handleSubmit = useCallback(async () => {
    const trimmedWord = word.trim();
    const trimmedContext = context.trim();
    if (!trimmedWord || isLoading) return;
    if (trimmedWord.length > INPUT_LIMIT || trimmedContext.length > CONTEXT_LIMIT) {
      setError('Texto demasiado largo.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResponse('');

    try {
      const res = await fetch('/uploader/api/word-helper', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          word: trimmedWord,
          sentence: trimmedContext,
          lessonId,
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

      setResponse(reply);
      void speak(reply);
    } catch (err: any) {
      setError(err?.message || String(err));
    } finally {
      setIsLoading(false);
    }
  }, [context, isLoading, lessonId, speak, word]);

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      handleSubmit();
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
    <div className="word-helper-card">
      <div className="word-helper-header">
        <div>
          <div className="word-helper-title">Explicador de palabras</div>
          <div className="word-helper-subtitle">
            Selecciona una palabra del texto o escribe una aqui.
          </div>
        </div>
        <label className="word-helper-toggle">
          <input
            type="checkbox"
            checked={voiceReplies}
            onChange={event => setVoiceReplies(event.target.checked)}
          />
          <span>Voz en respuestas</span>
        </label>
      </div>

      <div className="word-helper-inputs">
        <input
          type="text"
          value={word}
          onChange={event => setWord(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Palabra en ingles"
          className="ui-input"
        />
        <textarea
          value={context}
          onChange={event => setContext(event.target.value)}
          placeholder="Escribe la oracion o contexto en ingles (opcional)"
          className="ui-textarea"
          rows={3}
        />
      </div>

      <div className="word-helper-actions">
        <div className="word-helper-hint">
          {speechSupported ? 'Dicta el contexto en espanol si quieres.' : 'Microfono no soportado.'}
        </div>
        <div className="word-helper-buttons">
          <button
            type="button"
            className={`ui-button ui-button-secondary word-helper-mic${isListening ? ' word-helper-mic--active' : ''}`}
            onClick={handleToggleListening}
            disabled={!speechSupported}
          >
            {isListening ? 'Detener' : 'Mic'}
          </button>
          <button
            type="button"
            className="ui-button ui-button-primary"
            onClick={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? 'Buscando...' : 'Explicar'}
          </button>
        </div>
      </div>

      {error && <div className="word-helper-error">{error}</div>}
      {ttsError && <div className="word-helper-error">{ttsError}</div>}

      {response && (
        <div className="word-helper-response">
          <div className="word-helper-response__label">Respuesta</div>
          <div className="word-helper-response__text">{renderTaggedText(response)}</div>
        </div>
      )}
    </div>
  );
}
