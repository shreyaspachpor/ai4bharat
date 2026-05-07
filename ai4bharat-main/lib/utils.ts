import { tradeIcons } from "@/constants";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Returns the emoji icon for a given trade/role */
export const getRoleIcon = (role: string): string => {
  const normalizedRole = role.toLowerCase().trim();

  // Direct match
  if (tradeIcons[normalizedRole]) return tradeIcons[normalizedRole];

  // Partial match
  for (const [key, icon] of Object.entries(tradeIcons)) {
    if (normalizedRole.includes(key)) return icon;
  }

  return "💼"; // Default
};

// Shuffle array using Fisher-Yates algorithm
export const shuffleArray = <T,>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

// Generate context from conversation messages
export const generateContextFromMessages = (messages: Array<{ role: string; content: string }>): string => {
  const userMessages = messages
    .filter((msg) => msg.role === "user")
    .map((msg) => msg.content);
  
  if (userMessages.length === 0) return "";
  
  return userMessages
    .map((msg, index) => `Answer ${index + 1}: ${msg}`)
    .join("\n");
};

// Extract mentioned keywords/topics from user answers (trade-relevant)
export const extractTopicsFromAnswers = (messages: Array<{ role: string; content: string }>): string[] => {
  const userMessages = messages
    .filter((msg) => msg.role === "user")
    .map((msg) => msg.content.toLowerCase())
    .join(" ");
  
  // Blue-collar & trade keywords
  const keywords = [
    "wiring", "plumbing", "welding", "masonry", "carpentry",
    "safety", "installation", "repair", "maintenance", "tools",
    "construction", "electrical", "pipe", "cement", "concrete",
    "measurement", "blueprint", "iti", "diploma", "certificate",
    "experience", "site", "supervisor", "foreman", "training",
    "machine", "equipment", "motor", "panel", "fitting",
    "painting", "polishing", "grinding", "cutting", "drilling",
  ];
  
  return keywords.filter((keyword) => userMessages.includes(keyword));
};
