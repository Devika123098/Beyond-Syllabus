"use server";

import { ai } from "@/ai/ai";

/**
 * @fileOverview An AI agent that can answer questions about a given syllabus context.
 */

export interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface ChatWithSyllabusInput {
  history: Message[];
  message: string;
  model?: string;
}

export interface ChatWithSyllabusOutput {
  response: string;
  suggestions?: string[];
}

// ---------------------- Flow Logic ----------------------
const chatWithSyllabusFlow = async (
  input: ChatWithSyllabusInput
): Promise<ChatWithSyllabusOutput> => {
  const conversationHistory = input.history
    .map((msg) => `- ${msg.role}: ${msg.content}`)
    .join("\n");

  const promptText = `
🎓 You are a patient and adaptable study tutor. Your mission is to make learning clear, enjoyable, and boost learner confidence.

✨ Workflow:
Begin with a concise checklist (3-7 bullets) of what you will do; keep items conceptual, not implementation-level.
1. 🧑‍🏫 TEACH: Provide a clear, simple, and concise explanation of the topic.
   - Use friendly examples and brief sentences for readability and ease.
2. 📝 PRACTICE: Present one short practice problem, then wait for the learner’s response.
   - Offer a helpful hint if the learner requests one.
3. ✅ CHECK: Review the learner's answer, explain your reasoning step by step, and mention one common misconception to watch for.
   - After reviewing, validate that your feedback is clear; if not, revise your explanation to improve clarity.
4. 🔄 REFLECT: Ask the learner to restate the concept in their own words to help reinforce memory.

📋 Rules:
- Respond directly to all education-related questions without prompting the learner to ask first.
- Maintain a respectful, encouraging, and motivating tone throughout. 🌟
- Use light, friendly emojis to enhance explanations, but avoid overuse.
- Conclude with 2–3 short, engaging follow-up questions to spark the learner’s curiosity. 

Conversation History:
${conversationHistory}

User's Message: "${input.message}"
`;

  try {
    const chatCompletion = await ai.chat.completions.create({
      messages: [{ role: "user", content: promptText }],
      model: input.model || "openai/gpt-oss-20b",
      temperature: 0.5,
      max_completion_tokens: 2048,
      top_p: 0.95,
    });

    const outputText = chatCompletion.choices?.[0]?.message?.content || "";

    try {
      const parsed = JSON.parse(outputText);
      return parsed as ChatWithSyllabusOutput;
    } catch {
      return {
        response: outputText,
        suggestions: [],
      };
    }
  } catch (e) {
    console.error("Error in chat flow:", e);
    return {
      response:
        "I'm having trouble with that request. You could try rephrasing it, or switch to a different model to see if it works better.",
      suggestions: ["Try a different model", "Rephrase the question"],
    };
  }
};

// ---------------------- Exported Function ----------------------
export async function chatWithSyllabus(
  input: ChatWithSyllabusInput
): Promise<ChatWithSyllabusOutput> {
  return chatWithSyllabusFlow(input);
}
