"use server";

import { ai } from "@/ai/ai";

export interface SummarizeSyllabusInput {
  syllabusText: string;
}

export interface SummarizeSyllabusOutput {
  summary: string;
}

export async function summarizeSyllabus(
  input: SummarizeSyllabusInput
): Promise<SummarizeSyllabusOutput> {
  return summarizeSyllabusFlow(input);
}

const summarizeSyllabusFlow = async (
  input: SummarizeSyllabusInput
): Promise<SummarizeSyllabusOutput> => {
  const chatCompletion = await ai.chat.completions.create({
    messages: [
      {
        role: "system",
        content: "You are an expert academic curriculum analyst specializing in educational content summarization. Your expertise includes identifying core learning objectives, skill development outcomes, and knowledge domains across various academic disciplines."
      },
      {
        role: "user",
        content: `Please analyze the following syllabus and create a comprehensive summary following this structure:

**ANALYSIS FRAMEWORK:**
1. First, identify the subject area and academic level
2. Extract core learning objectives and outcomes
3. Categorize knowledge domains and skill areas
4. Highlight practical applications and assessments

**OUTPUT FORMAT:**
Create a well-structured summary that includes:

## Course Overview
- Subject area and level
- Duration and credit information (if available)

## Key Learning Objectives
- List 4-6 primary learning goals
- Focus on what students will be able to DO after completion

## Core Knowledge Areas
- Main topics and concepts covered
- Theoretical foundations
- Practical applications

## Skills Development
- Technical skills gained
- Analytical and critical thinking abilities
- Professional competencies

## Assessment Methods
- Types of evaluations mentioned
- Projects and practical work

**REQUIREMENTS:**
- Use clear, concise language suitable for students
- Prioritize actionable learning outcomes
- Maintain academic tone while being accessible
- Limit summary to 300-400 words
- Use bullet points and headers for readability

**SYLLABUS TEXT:**
${input.syllabusText}

Generate the summary now, ensuring it captures the essence of what students will learn and achieve in this course.`
      },
    ],
    model: "llama-3.1-8b-instant",
    temperature: 0.3, // Reduced for more consistent, factual output
    max_completion_tokens: 1024,
    top_p: 0.85, // Slightly reduced for more focused responses
  });

  const summary = chatCompletion.choices?.[0]?.message?.content || "";
  return { summary };
};
