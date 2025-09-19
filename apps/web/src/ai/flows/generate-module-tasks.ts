"use server";

import { ai } from "@/ai/ai";

/**
 * @fileOverview An AI agent that generates learning tasks and real-world applications for a given module content.
 */

export interface GenerateModuleTasksInput {
  moduleContent: string;
  moduleTitle: string;
  model?: string;
}

export interface GenerateModuleTasksOutput {
  introductoryMessage: string;
  suggestions: string[];
}

// ---------------------- Flow Logic ----------------------
const generateModuleTasksFlow = async (
  input: GenerateModuleTasksInput
): Promise<GenerateModuleTasksOutput> => {
  const promptText = `
You are an expert curriculum assistant. Your task is to generate a welcoming introductory message for a syllabus module, adhering strictly to the output structure below.

Begin with a concise checklist (3-7 bullets) of the steps you will follow; keep these conceptual (e.g., draft intro, generate tasks, validate structure).

For your main response, provide the following fields:

- **introductoryMessage**: This field must contain:
  1. A friendly, welcoming introduction.
  2. Three explicit, clearly-labeled subsections, each presented as a markdown list within a single string:
     - **Learning Tasks:** List 2–4 curriculum-specific tasks as markdown bullet points.
     - **Real-World Applications:** Give 2–3 relevant applications as markdown bullet points.
     - **Follow-Up Questions:** Offer 3–4 discussion or reflection questions using markdown bullet points.
  All items in these lists must be plain strings (no formatting except markdown bullets). If providing the minimum required items for any subsection is not possible, include as many as possible and add a brief note at the beginning of 'introductoryMessage' specifying which section(s) have fewer items than required.

- **suggestions**: Provide 2–3 additional, unique teaching tips or extension activities that do not overlap with the items listed in 'Learning Tasks' or other sections. Suggestions must be supplied as a string array.

Before finalizing your output, confirm that all fields are present, all markdown lists are correctly formatted within the string, and that 'suggestions' is a JSON string array of 2–3 non-duplicated items. If not, self-correct and rebuild the output to match the specification.

# Output Format
Return a JSON object structured as follows:
{
  "introductoryMessage": "<Intro text>\n\n**Learning Tasks:**\n- ...\n- ...\n\n**Real-World Applications:**\n- ...\n- ...\n\n**Follow-Up Questions:**\n- ...\n- ...\n...",
  "suggestions": ["<Teaching tip 1>", "<Teaching tip 2>", ...]
}
Each markdown list in 'introductoryMessage' must be a string. Each 'suggestions' entry must be unique and not present in the markdown lists. If any section is missing items, append a note at the start of 'introductoryMessage' indicating which one(s) are below the minimum.
Module Title: "${input.moduleTitle}"
Module Content: "${input.moduleContent}"
`;

  try {
    const chatCompletion = await ai.chat.completions.create({
      messages: [{ role: "user", content: promptText }],
      model: input.model || "openai/gpt-oss-20b",
      temperature: 0.5,
      max_completion_tokens: 2048,
      top_p: 0.95,
    });

    let outputText = chatCompletion.choices?.[0]?.message?.content || "";

    // === Sanitize AI output: remove ```json or ``` wrappers ===
    outputText = outputText
      .trim()
      .replace(/^```json\s*/, "")
      .replace(/^```/, "")
      .replace(/```$/, "");

    const output = JSON.parse(outputText);
    return output as GenerateModuleTasksOutput;
  } catch (e) {
    console.error(
      `Error generating tasks for module "${input.moduleTitle}":`,
      e
    );

    return {
      introductoryMessage: `Hello! I ran into some issues generating the introduction for "${input.moduleTitle}". You can try again or change the AI model if needed.`,
      suggestions: [
        `Try using a different AI model for "${input.moduleTitle}"`,
        "Rephrase your module content and try again",
        `What are the key topics in "${input.moduleTitle}"?`,
        "Can you provide a brief overview of this module?",
      ],
    };
  }
};

export async function generateModuleTasks(
  input: GenerateModuleTasksInput
): Promise<GenerateModuleTasksOutput> {
  return generateModuleTasksFlow(input);
}
