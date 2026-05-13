export type Gender = "Male" | "Female";
export type Occupation = "Student" | "Job" | "Business";
export type RelationshipStatus = "Single" | "In a Relationship";
export type ReminderStyle = "Gentle" | "Strict";
export type CompanionId = "Mala" | "Joseph";

export interface UserProfile {
  name: string;
  gender: Gender;
  occupation: Occupation;
  wakeTime: string;
  peakTime: string;
  relationship: RelationshipStatus;
  reminderStyle: ReminderStyle;
  companion: CompanionId;
  onboarded: boolean;
}

export interface TodoItem {
  id: string;
  text: string;
  completed: boolean;
  createdAt: number;
}

export interface AIResponse {
  text: string;
  pose: string;
  action: string;
  todoUpdate?: string[];
}

export type AppStatus = "idle" | "listening" | "thinking" | "speaking";
