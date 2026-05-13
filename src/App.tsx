import React, { useState, useEffect, useRef } from "react";
import { Settings } from "lucide-react";
import { BackgroundVideos } from "./components/BackgroundVideos";
import { Onboarding } from "./components/Onboarding";
import { Companion } from "./components/Companion";
import { MicButton } from "./components/MicButton";
import { TodoList } from "./components/TodoList";
import { UserProfile, AppStatus, TodoItem, AIResponse } from "./types";
import { COMPANIONS } from "./constants";
import axios from "axios";

export default function App() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [status, setStatus] = useState<AppStatus>("idle");
  const [pose, setPose] = useState<string>("idle");
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [loopActive, setLoopActive] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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

  const startVoiceLoop = async () => {
    if (loopActive) {
      stopVoiceLoop();
      return;
    }
    setLoopActive(true);
    await startListening();
  };

  const stopVoiceLoop = () => {
    setLoopActive(false);
    setStatus("idle");
    setPose("idle");
    if (mediaRecorderRef.current) mediaRecorderRef.current.stop();
    if (audioPlayerRef.current) audioPlayerRef.current.pause();
    if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
  };

  const startListening = async () => {
    if (!loopActive && status !== "idle") return;
    setStatus("listening");
    setPose("idle");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/wav" });
        await processVoice(audioBlob);
      };

      mediaRecorder.start();

      // Silence detection (1.5 seconds)
      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;
      const source = audioContext.createMediaStreamSource(stream);
      const analyzer = audioContext.createAnalyser();
      source.connect(analyzer);

      const bufferLength = analyzer.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      
      const checkSilence = () => {
        if (status !== "listening") return;
        analyzer.getByteFrequencyData(dataArray);
        const volume = dataArray.reduce((a, b) => a + b) / bufferLength;
        
        if (volume < 5) { // Threshold for silence
          if (!silenceTimeoutRef.current) {
            silenceTimeoutRef.current = setTimeout(() => {
              if (mediaRecorderRef.current?.state === "recording") {
                mediaRecorderRef.current.stop();
                stream.getTracks().forEach(t => t.stop());
              }
            }, 1500);
          }
        } else {
          if (silenceTimeoutRef.current) {
            clearTimeout(silenceTimeoutRef.current);
            silenceTimeoutRef.current = null;
          }
        }
        
        if (status === "listening") requestAnimationFrame(checkSilence);
      };

      checkSilence();
    } catch (err) {
      console.error("Mic error:", err);
      // Fallback: use Web Speech API or just alert
      alert("Microphone access denied. Please enable it for DawnMind.");
      setLoopActive(false);
      setStatus("idle");
    }
  };

  const processVoice = async (blob: Blob) => {
    setStatus("thinking");
    try {
      // 1. STT (using ElevenLabs STT)
      const sttResponse = await axios.post("/api/stt", blob, {
        headers: { "Content-Type": "audio/wav" }
      });
      const transcript = sttResponse.data.text;

      if (!transcript || transcript.length < 2) {
        if (loopActive) startListening();
        else setStatus("idle");
        return;
      }

      // 2. Chat (Groq)
      const companion = COMPANIONS[profile!.companion];
      const systemPrompt = `You are ${companion.name}. User is ${profile!.name}, ${profile!.occupation}, wakes at ${profile!.wakeTime}, peak work at ${profile!.peakTime}, ${profile!.relationship}, wants ${profile!.reminderStyle} reminders. Current time: ${new Date().toLocaleTimeString()}. Todos: ${todos.map(t => t.text).join(", ")}. Keep responses to 2-3 sentences, warm and natural. If user mentions a task add it to todo. Return JSON: {text, pose, action, todoUpdate}`;
      
      const chatResponse = await axios.post("/api/chat", {
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: transcript }
        ]
      });

      const aiRes: AIResponse = JSON.parse(chatResponse.data.choices[0].message.content);
      
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

      // 3. TTS
      setPose(aiRes.pose || "idle");
      setStatus("speaking");
      const ttsResponse = await axios.post("/api/tts", {
        text: aiRes.text,
        voiceId: companion.voiceId
      }, { responseType: "blob" });

      const audioUrl = URL.createObjectURL(ttsResponse.data);
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
