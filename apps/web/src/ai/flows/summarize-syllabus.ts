"use server";

import { ai } from "@/ai/ai";

export interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface ChatWithSyllabusInput {
  history: Message[];
  message: string;
  model?: string;
  syllabusContext?: string; // Added for context-aware filtering
}

export interface ChatWithSyllabusOutput {
  response: string;
  suggestions?: string[];
}

const chatWithSyllabusFlow = async (
  input: ChatWithSyllabusInput
): Promise<ChatWithSyllabusOutput> => {
  // Content filtering function
  const isEducationalQuery = (message: string): boolean => {
    const nonEducationalKeywords = [
      'messi', 'ronaldo', 'football', 'soccer', 'celebrity', 'movie', 'song', 
      'politics', 'religion', 'dating', 'personal life', 'gossip', 'entertainment',
      'sports', 'music', 'tv show', 'netflix', 'youtube', 'instagram', 'tiktok',
      'gaming', 'game', 'food recipe', 'cooking', 'weather', 'news', 'current events'
    ];
    
    const educationalKeywords = [
      'explain', 'define', 'concept', 'theory', 'formula', 'solve', 'calculate',
      'understand', 'learn', 'study', 'homework', 'assignment', 'exam', 'test',
      'subject', 'course', 'syllabus', 'curriculum', 'chapter', 'lesson'
    ];
    
    const messageLower = message.toLowerCase();
    const hasNonEducational = nonEducationalKeywords.some(keyword => 
      messageLower.includes(keyword)
    );
    const hasEducational = educationalKeywords.some(keyword => 
      messageLower.includes(keyword)
    );
    
    return !hasNonEducational || hasEducational;
  };

  // Check if query is educational
  if (!isEducationalQuery(input.message)) {
    return {
      response: "I'm an educational assistant focused on helping with academic studies and coursework. I can only answer questions related to your syllabus, course materials, and educational topics. Please ask me something about your studies! 📚",
      suggestions: [
        "Explain a concept from your syllabus",
        "Help with a practice problem",
        "Clarify course material"
      ]
    };
  }

  const conversationHistory = input.history
    .map((msg) => `${msg.role}: ${msg.content}`)
    .join("\n");

  const promptText = `You are a specialized educational AI tutor with STRICT BOUNDARIES. You must ONLY respond to academic and educational queries related to the provided syllabus context.

**CORE IDENTITY & CONSTRAINTS:**
- Role: Academic Study Assistant specializing in curriculum-based learning
- Scope: ONLY educational content, course materials, and study-related topics
- Boundaries: NEVER discuss celebrities, sports, entertainment, politics, personal topics, or non-academic subjects

**MANDATORY CONTENT FILTERING:**
- If a user asks about non-educational topics (celebrities, sports, movies, personal questions, etc.), respond with: "I'm focused exclusively on helping with your academic studies. Please ask me about concepts, assignments, or topics from your coursework."
- ALWAYS redirect to educational content when off-topic questions are asked
- You are NOT a general chatbot - you are an academic tutor ONLY

**SYLLABUS CONTEXT:**
${input.syllabusContext || "Focus on general academic subjects and study skills"}

**EDUCATIONAL METHODOLOGY:**
1. 🎯 **ASSESS**: Determine if the question is educational and syllabus-relevant
2. 📖 **TEACH**: Provide clear, structured explanations with examples
3. 🧠 **ENGAGE**: Create practice problems or thought-provoking questions
4. ✅ **VERIFY**: Check understanding and correct misconceptions
5. 🔄 **REINFORCE**: Encourage active learning and self-explanation

**RESPONSE GUIDELINES:**
- Keep explanations concise but comprehensive (150-300 words)
- Use bullet points and clear structure
- Include relevant examples from the syllabus context
- End with 2-3 follow-up questions to deepen understanding
- Maintain encouraging, professional tone
- Use minimal emojis (1-2 per response maximum)

**CONVERSATION HISTORY:**
${conversationHistory}

**CURRENT STUDENT QUESTION:** "${input.message}"

**INSTRUCTIONS:**
1. First, verify this is an educational question
2. If non-educational, politely redirect to academic topics
3. If educational, provide structured learning support following the methodology above
4. Always stay within the bounds of academic assistance

Respond now:`;

  try {
    const chatCompletion = await ai.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are an educational AI assistant that ONLY helps with academic studies, coursework, and educational topics. You must refuse to discuss non-educational topics and redirect users to study-related questions."
        },
        {
          role: "user",
          content: promptText
        }
      ],
      model: input.model || "llama-3.1-8b-instant",
      temperature: 0.4, // Reduced for more consistent, focused responses
      max_completion_tokens: 1024, // Reduced for more concise responses
      top_p: 0.85,
    });

    const outputText = chatCompletion.choices?.[0]?.message?.content || "";

    // Additional safety check on response
    const containsNonEducational = /\b(messi|ronaldo|celebrity|entertainment|movie|politics)\b/i.test(outputText);
    if (containsNonEducational) {
      return {
        response: "I'm designed to focus exclusively on educational content and academic support. Let's discuss your coursework, assignments, or study topics instead! 📚",
        suggestions: [
          "Ask about a specific concept from your syllabus",
          "Request help with practice problems",
          "Clarify difficult course material"
        ]
      };
    }

    return {
      response: outputText,
      suggestions: [
        "Can you explain this concept differently?",
        "Give me a practice problem on this topic",
        "What are common mistakes students make here?"
      ]
    };

  } catch (e) {
    console.error("Error in educational chat flow:", e);
    return {
      response: "I'm having trouble processing your educational query right now. Please try rephrasing your study-related question, and I'll be happy to help with your coursework! 📚",
      suggestions: [
        "Try asking about a specific topic",
        "Rephrase your question more clearly",
        "Ask for help with course concepts"
      ]
    };
  }
};

export async function chatWithSyllabus(
  input: ChatWithSyllabusInput
): Promise<ChatWithSyllabusOutput> {
  return chatWithSyllabusFlow(input);
}
