import React, { useState, useEffect, useRef } from "react";
import { Settings } from "lucide-react";
import { BackgroundVideos } from "./components/BackgroundVideos";
import { Onboarding } from "./components/Onboarding";
import { Companion } from "./components/Companion";
import { MicButton } from "./components/MicButton";
import { TodoList } from "./components/TodoList";
import { UserProfile, AppStatus, TodoItem, AIResponse } from "./types";
import { COMPANIONS } from "./constants";

// Type definitions for SpeechRecognition if needed (some browsers don't have it in @types/node)
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export default function App() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [status, setStatus] = useState<AppStatus>("idle");
  const [pose, setPose] = useState<string>("idle");
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [loopActive, setLoopActive] = useState(false);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const recognitionRef = useRef<any>(null);

  // Load from local storage
  useEffect(() => {
    const saved = localStorage.getItem("dawnmind_profile");
    if (saved) setProfile(JSON.parse(saved));
    
    const savedTodos = localStorage.getItem("dawnmind_todos");
    if (savedTodos) setTodos(JSON.parse(savedTodos));
  }, []);

  const saveProfile = (p: UserProfile) => {
    localStorage.setItem("dawnmind_profile", JSON.stringify(p));
    setProfile(p);
  };

  const saveTodos = (t: TodoItem[]) => {
    localStorage.setItem("dawnmind_todos", JSON.stringify(t));
    setTodos(t);
  };

  const toggleTodo = (id: string) => {
    const newTodos = todos.map(t => t.id === id ? { ...t, completed: !t.completed } : t);
    saveTodos(newTodos);
  };

  const startVoiceLoop = () => {
    if (loopActive) {
      stopVoiceLoop();
      return;
    }
    setLoopActive(true);
    startListening();
  };

  const stopVoiceLoop = () => {
    setLoopActive(false);
    setStatus("idle");
    setPose("idle");
    if (recognitionRef.current) {
      recognitionRef.current.onend = null;
      recognitionRef.current.stop();
    }
    if (audioPlayerRef.current) audioPlayerRef.current.pause();
  };

  const startListening = () => {
    if (!loopActive && status !== "idle") return;
    
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice recognition is not supported in this browser.");
      setLoopActive(false);
      return;
    }

    setStatus("listening");
    setPose("idle");

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.lang = "en-US";
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      processUserInput(transcript);
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error", event.error);
      if (loopActive) {
        setTimeout(startListening, 1000);
      } else {
        setStatus("idle");
      }
    };

    recognition.onend = () => {
      if (status === "listening" && loopActive) {
        // If it ended without result and we are still in loop, restart
        setTimeout(startListening, 100);
      }
    };

    recognition.start();
  };

  const processUserInput = async (transcript: string) => {
    if (!transcript || transcript.length < 2) {
      if (loopActive) startListening();
      else setStatus("idle");
      return;
    }

    setStatus("thinking");
    try {
      // 1. Chat (Direct OpenRouter)
      const companion = COMPANIONS[profile!.companion];
      const personaGuidelines = profile!.companion === "Mala" 
        ? "Mala is warm, caring, and soothing. She speaks like a gentle older sister or a kind mentor. She prioritizes mental wellbeing and gentle encouragement. Use poses: idle, wave (greeting), thumbsup (affirmation), remind (task focus)."
        : "Joseph is energetic, motivational, and direct. He speaks like a high-performance coach. He pushes the user to be their best self and focus on goals. Use poses: idle, fist (motivation), point (direction), arms (confidence).";

      const systemPrompt = `
        You are ${companion.name}. ${personaGuidelines}
        
        USER CONTEXT:
        - Name: ${profile!.name}
        - Occupation: ${profile!.occupation}
        - Life Rhythm: Wakes at ${profile!.wakeTime}, peak focus at ${profile!.peakTime}
        - Personal: ${profile!.relationship} status
        - Preferences: Wants ${profile!.reminderStyle} reminders
        
        CURRENT STATE:
        - Time: ${new Date().toLocaleTimeString()}
        - Todos: ${todos.map(t => t.text).join(", ")}
        
        CONSTRAINTS:
        - Responses MUST be 2-3 sentences max.
        - Stay strictly in character.
        - If the user mentions a new task, explicitly add it to the 'todoUpdate' array in the JSON.
        - Output ONLY valid JSON in this format: {"text": "...", "pose": "...", "action": "...", "todoUpdate": ["task1", "task2"]}
      `;
      
      const chatResRaw = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${import.meta.env.VITE_OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://dawnmind.vercel.app",
          "X-Title": "DawnMind"
        },
        body: JSON.stringify({
          model: "meta-llama/llama-3.3-70b-instruct:free",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: transcript }
          ],
          max_tokens: 200
        })
      });

      const chatData = await chatResRaw.json();
      let content = chatData.choices[0].message.content;
      
      // Resilient JSON parsing
      let aiRes: AIResponse;
      try {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          aiRes = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error("No JSON found in response");
        }
      } catch (parseErr) {
        aiRes = {
          text: content.length > 200 ? content.slice(0, 200) + "..." : content,
          pose: "idle",
          action: "none"
        };
      }
      
      // Update Todos if any
      if (aiRes.todoUpdate && aiRes.todoUpdate.length > 0) {
        const newTodos = [...todos];
        aiRes.todoUpdate.forEach(task => {
          if (!newTodos.find(t => t.text.toLowerCase() === task.toLowerCase())) {
            newTodos.push({ id: Math.random().toString(36).substr(2, 9), text: task, completed: false, createdAt: Date.now() });
          }
        });
        saveTodos(newTodos);
      }

      // 2. TTS (Direct ElevenLabs)
      setPose(aiRes.pose || "idle");
      setStatus("speaking");
      
      const ttsResRaw = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${companion.voiceId}`, {
        method: "POST",
        headers: {
          "xi-api-key": import.meta.env.VITE_ELEVENLABS_API_KEY,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          text: aiRes.text,
          model_id: "eleven_turbo_v2_5",
          voice_settings: {
            stability: 0.75,
            similarity_boost: 0.75,
            speed: 0.82,
            style: 0.35
          }
        })
      });

      const audioBlob = await ttsResRaw.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      audioPlayerRef.current = audio;
      audio.onended = () => {
        if (loopActive) startListening();
        else {
          setStatus("idle");
          setPose("idle");
        }
      };
      audio.play();

    } catch (err) {
      console.error("Process error:", err);
      setStatus("idle");
      setLoopActive(false);
    }
  };

  if (!profile) {
    return (
      <div className="relative h-screen w-screen overflow-hidden bg-black font-sans">
        <BackgroundVideos />
        <Onboarding onComplete={saveProfile} />
      </div>
    );
  }

  const timeString = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "morning";
    if (hour < 17) return "afternoon";
    return "evening";
  };

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-black font-sans text-white">
      <BackgroundVideos />
      
      {/* HUD components */}
      <div className="absolute top-8 left-8 z-30">
        <h1 className="text-xl font-medium tracking-tight">
          Good {timeString()}, <span className="font-bold">{profile.name}</span>
        </h1>
        <p className="text-white/40 text-[10px] uppercase tracking-widest mt-1">Mental wellbeing companion</p>
      </div>

      <button 
        onClick={() => setProfile(null)}
        className="absolute top-8 right-8 z-30 p-2 hover:bg-white/10 rounded-full transition-colors"
      >
        <Settings className="w-6 h-6 text-white/60" />
      </button>

      {/* Main Content Area */}
      <div className="absolute inset-0 flex flex-col items-center justify-end pb-24 z-30">
        <TodoList todos={todos.filter(t => !t.completed)} onToggle={toggleTodo} />
        <MicButton status={status} onClick={startVoiceLoop} />
      </div>

      <Companion id={profile.companion} pose={pose} />

      {/* Subtle overlay elements */}
      <div className="absolute inset-0 pointer-events-none bg-radial-gradient from-transparent to-black/20" />
    </div>
  );
}
