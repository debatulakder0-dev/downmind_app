import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { UserProfile, Gender, Occupation, RelationshipStatus, ReminderStyle, CompanionId } from "../types";
import { COMPANIONS } from "../constants";
import { cn } from "../lib/utils";
import { Mic, User, Briefcase, Clock, Heart, Bell, ChevronRight, Check } from "lucide-react";

interface OnboardingProps {
  onComplete: (profile: UserProfile) => void;
}

export const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [step, setStep] = useState(0);
  const [profile, setProfile] = useState<Partial<UserProfile>>({
    name: "",
    gender: "Female",
    occupation: "Student",
    wakeTime: "07:00 AM",
    peakTime: "10:00 AM",
    relationship: "Single",
    reminderStyle: "Gentle",
    companion: "Mala",
  });

  const nextStep = () => setStep((s) => s + 1);
  const prevStep = () => setStep((s) => s - 1);

  const updateProfile = (updates: Partial<UserProfile>) => {
    const newProfile = { ...profile, ...updates };
    
    // Auto-assignment logic: male + in relationship = Joseph, all others = Mala
    if (newProfile.gender === "Male" && newProfile.relationship === "In a Relationship") {
      newProfile.companion = "Joseph";
    } else {
      newProfile.companion = "Mala";
    }
    
    setProfile(newProfile);
  };

  const steps = [
    {
      title: "What's your name?",
      icon: <User className="w-8 h-8" />,
      component: (
        <div className="space-y-4">
          <input
            type="text"
            placeholder="Your name..."
            className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/30"
            value={profile.name}
            onChange={(e) => updateProfile({ name: e.target.value })}
            autoFocus
          />
          <p className="text-xs text-white/60">Voice input: "My name is [Name]" (Coming soon)</p>
        </div>
      ),
    },
    {
      title: "Tell us about yourself",
      icon: <Briefcase className="w-8 h-8" />,
      component: (
        <div className="space-y-6">
          <div>
            <label className="text-sm text-white/60 mb-2 block">Gender</label>
            <div className="flex gap-2">
              {(["Male", "Female"] as Gender[]).map((g) => (
                <button
                  key={g}
                  onClick={() => updateProfile({ gender: g })}
                  className={cn(
                    "flex-1 py-2 rounded-lg border transition-all",
                    profile.gender === g ? "bg-white text-black border-white" : "bg-white/5 text-white border-white/20 hover:bg-white/10"
                  )}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-sm text-white/60 mb-2 block">Occupation</label>
            <div className="grid grid-cols-3 gap-2">
              {(["Student", "Job", "Business"] as Occupation[]).map((o) => (
                <button
                  key={o}
                  onClick={() => updateProfile({ occupation: o })}
                  className={cn(
                    "py-2 rounded-lg border text-sm transition-all",
                    profile.occupation === o ? "bg-white text-black border-white" : "bg-white/5 text-white border-white/20 hover:bg-white/10"
                  )}
                >
                  {o}
                </button>
              ))}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Daily Rhythm",
      icon: <Clock className="w-8 h-8" />,
      component: (
        <div className="space-y-6">
          <div>
            <label className="text-sm text-white/60 mb-2 block">Wake Up Time</label>
            <input
              type="text"
              placeholder="e.g. 7:00 AM"
              className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/30"
              value={profile.wakeTime}
              onChange={(e) => updateProfile({ wakeTime: e.target.value })}
            />
          </div>
          <div>
            <label className="text-sm text-white/60 mb-2 block">Peak Focus Time</label>
            <input
              type="text"
              placeholder="e.g. 10:00 AM"
              className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/30"
              value={profile.peakTime}
              onChange={(e) => updateProfile({ peakTime: e.target.value })}
            />
          </div>
        </div>
      ),
    },
    {
      title: "Life & Style",
      icon: <Heart className="w-8 h-8" />,
      component: (
        <div className="space-y-6">
          <div>
            <label className="text-sm text-white/60 mb-2 block">Relationship Status</label>
            <div className="flex gap-2">
              {(["Single", "In a Relationship"] as RelationshipStatus[]).map((r) => (
                <button
                  key={r}
                  onClick={() => updateProfile({ relationship: r })}
                  className={cn(
                    "flex-1 py-2 px-1 rounded-lg border text-sm transition-all",
                    profile.relationship === r ? "bg-white text-black border-white" : "bg-white/5 text-white border-white/20 hover:bg-white/10"
                  )}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-sm text-white/60 mb-2 block">Reminder Style</label>
            <div className="flex gap-2">
              {(["Gentle", "Strict"] as ReminderStyle[]).map((s) => (
                <button
                  key={s}
                  onClick={() => updateProfile({ reminderStyle: s })}
                  className={cn(
                    "flex-1 py-2 rounded-lg border transition-all",
                    profile.reminderStyle === s ? "bg-white text-black border-white" : "bg-white/5 text-white border-white/20 hover:bg-white/10"
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Choose Your Companion",
      icon: <Bell className="w-8 h-8" />,
      component: (
        <div className="grid grid-cols-2 gap-4">
          {(["Mala", "Joseph"] as CompanionId[]).map((c) => (
            <button
              key={c}
              onClick={() => updateProfile({ companion: c })}
              className={cn(
                "p-4 rounded-xl border transition-all text-left relative",
                profile.companion === c ? "bg-white text-black border-white" : "bg-white/5 text-white border-white/20 hover:bg-white/10"
              )}
            >
              <div className="font-bold mb-1">{c}</div>
              <div className={cn("text-[10px]", profile.companion === c ? "text-black/60" : "text-white/60")}>
                {COMPANIONS[c].description}
              </div>
              {profile.companion === c && <Check className="absolute top-2 right-2 w-4 h-4" />}
            </button>
          ))}
        </div>
      ),
    },
  ];

  const handleFinish = () => {
    if (profile.name) {
      onComplete({ ...profile, onboarded: true } as UserProfile);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 sm:p-0">
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 1.1, y: -20 }}
          className="glass w-full max-w-md rounded-[32px] p-8 space-y-8 relative overflow-hidden"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-white">
              {steps[step].icon}
            </div>
            <div>
              <p className="text-xs text-white/40 uppercase tracking-widest font-semibold">Step {step + 1} of {steps.length}</p>
              <h2 className="text-2xl font-bold text-white leading-tight">{steps[step].title}</h2>
            </div>
          </div>

          <div className="min-h-[160px] flex flex-col justify-center">
            {steps[step].component}
          </div>

          <div className="flex justify-between items-center pt-4">
            {step > 0 ? (
              <button 
                onClick={prevStep}
                className="text-white/60 text-sm font-medium hover:text-white transition-colors"
              >
                Back
              </button>
            ) : <div />}
            
            {step < steps.length - 1 ? (
              <button
                onClick={nextStep}
                disabled={step === 0 && !profile.name}
                className="bg-white text-black px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-white/90 disabled:opacity-50 transition-all"
              >
                Next <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleFinish}
                className="bg-white text-black px-8 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-white/90 transition-all"
              >
                Start Journey
              </button>
            )}
          </div>

          {/* Progress bar */}
          <div className="absolute bottom-0 left-0 h-1 bg-white/10 w-full">
            <motion.div 
              className="h-full bg-white"
              initial={{ width: 0 }}
              animate={{ width: `${((step + 1) / steps.length) * 100}%` }}
            />
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
