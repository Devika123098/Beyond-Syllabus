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
  // Input validation
  if (!input.syllabusText || input.syllabusText.trim().length < 10) {
    return {
      summary: "The provided syllabus text is too short or empty to generate a meaningful summary. Please provide more detailed course content including learning objectives, topics covered, and course structure."
    };
  }

  // Content validation for educational material
  const validateSyllabusContent = (text: string): boolean => {
    const nonEducationalKeywords = [
      'celebrity', 'entertainment', 'gossip', 'sports news', 'personal life',
      'social media', 'gaming', 'movies', 'tv shows', 'fashion', 'lifestyle',
      'politics', 'religion', 'dating', 'relationships', 'messi', 'ronaldo'
    ];

    const educationalKeywords = [
      'course', 'syllabus', 'learning', 'objectives', 'curriculum', 'student',
      'study', 'knowledge', 'skill', 'understand', 'analyze', 'concept',
      'theory', 'assignment', 'exam', 'module', 'chapter', 'lesson'
    ];

    const textLower = text.toLowerCase();
    
    const hasNonEducational = nonEducationalKeywords.some(keyword => 
      textLower.includes(keyword)
    );
    
    const hasEducational = educationalKeywords.some(keyword => 
      textLower.includes(keyword)
    ) || text.length > 100; // Allow longer texts that might be educational

    return !hasNonEducational && hasEducational;
  };

  // Validate content is educational
  if (!validateSyllabusContent(input.syllabusText)) {
    return {
      summary: "The provided content doesn't appear to be educational syllabus material. Please provide academic course content including learning objectives, topics covered, assessment methods, and course structure for summarization."
    };
  }

  try {
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
        }
      ],
      model: "llama-3.1-8b-instant",
      temperature: 0.3, // Reduced for more consistent, factual output
      max_completion_tokens: 1024,
      top_p: 0.85,
    });

    const summary = chatCompletion.choices?.[0]?.message?.content;

    // Validate AI response
    if (!summary || summary.trim().length < 50) {
      throw new Error("AI response too short or empty");
    }

    // Additional validation for educational content in summary
    const educationalCheck = /\b(learn|study|understand|concept|skill|knowledge|academic|course|student)\b/i;
    const nonEducationalCheck = /\b(messi|ronaldo|celebrity|entertainment|sports|movie|gaming)\b/i;

    if (nonEducationalCheck.test(summary) || !educationalCheck.test(summary)) {
      return {
        summary: "I can only summarize educational and academic content. The provided material doesn't appear to contain standard syllabus information such as learning objectives, course topics, or educational outcomes. Please provide authentic course syllabus content for summarization."
      };
    }

    return { summary: summary.trim() };

  } catch (error) {
    console.error("Error in syllabus summarization:", error);
    
    // Provide detailed error handling based on error type
    if (error instanceof Error) {
      if (error.message.includes('rate limit') || error.message.includes('429')) {
        return {
          summary: "The AI service is currently experiencing high demand. Please wait a moment and try generating the summary again. The syllabus content is ready for analysis once the service is available."
        };
      }
      
      if (error.message.includes('timeout') || error.message.includes('network')) {
        return {
          summary: "There was a network issue while generating the syllabus summary. Please check your connection and try again. The content appears to be valid educational material."
        };
      }

      if (error.message.includes('content') || error.message.includes('filter')) {
        return {
          summary: "The syllabus content couldn't be processed due to content restrictions. Please ensure the material contains standard academic content like learning objectives, course topics, and educational outcomes."
        };
      }
    }

    // Generic fallback with basic syllabus structure
    return {
      summary: `## Course Summary

I encountered an issue generating a detailed summary for this syllabus. However, based on the provided content, this appears to be educational course material.

## Key Points
- This course covers important academic concepts and learning objectives
- Students will develop both theoretical knowledge and practical skills
- The curriculum is designed to meet educational standards and learning outcomes

## Next Steps
- Try regenerating the summary in a moment
- Ensure the syllabus content includes clear learning objectives
- Verify that all course topics and assessment methods are included

Please try generating the summary again, or contact support if the issue persists. The syllabus content appears to be properly formatted educational material.`
    };
  }
};
