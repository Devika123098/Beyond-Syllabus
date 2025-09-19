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
  syllabusContext?: string;
  subjectArea?: string;
}

export interface ChatWithSyllabusOutput {
  response: string;
  suggestions?: string[];
}

const chatWithSyllabusFlow = async (
  input: ChatWithSyllabusInput
): Promise<ChatWithSyllabusOutput> => {
  
  // Very minimal filtering - only block obvious entertainment content
  const isEntertainmentQuery = (message: string): boolean => {
    const pureEntertainmentKeywords = [
      'celebrity gossip', 'movie review', 'tv show recap', 'entertainment news',
      'social media drama', 'fashion trends', 'lifestyle blog', 'dating advice',
      'party planning', 'vacation photos', 'restaurant review', 'music album review'
    ];

    const messageLower = message.toLowerCase();
    return pureEntertainmentKeywords.some(keyword => 
      messageLower.includes(keyword)
    );
  };

  // Only block obvious entertainment queries
  if (isEntertainmentQuery(input.message)) {
    return {
      response: "I focus on educational topics and academic discussions. Let's explore something related to your coursework or general learning! 📚",
      suggestions: [
        "Ask about a concept from your syllabus",
        "Explore a technical or academic topic",
        "Get help with course material"
      ]
    };
  }

  const conversationHistory = input.history
    .map((msg) => `${msg.role}: ${msg.content}`)
    .join("\n");

  // Enhanced prompt that prioritizes explanation over questioning
  const promptText = `You are an expert educational AI tutor with deep knowledge across all academic disciplines. Your primary goal is to provide comprehensive, clear explanations that help students understand concepts thoroughly.

**YOUR EXPERTISE:**
- Comprehensive educational assistant with expertise in all subjects
- Specializes in clear, detailed explanations of complex concepts
- Draws connections between syllabus content and broader educational context
- Provides practical examples and real-world applications
- Maintains focus on thorough understanding rather than testing knowledge

**SYLLABUS CONTEXT & PRIMARY FOCUS:**
${input.syllabusContext || "General educational content - provide comprehensive explanations for any academic topic"}

**SUBJECT AREA:**
${input.subjectArea || "Multi-disciplinary academic support"}

**TEACHING PHILOSOPHY:**
- **EXPLANATION-FIRST APPROACH**: Always provide thorough explanations before asking questions
- **SYLLABUS INTEGRATION**: When syllabus context is provided, reference and connect to that specific content
- **COMPREHENSIVE COVERAGE**: Cover concepts deeply rather than superficially
- **PRACTICAL CONNECTION**: Show how concepts apply in real-world scenarios
- **CONFIDENCE BUILDING**: Help students feel confident in their understanding

**RESPONSE STRUCTURE GUIDELINES:**

1. **IMMEDIATE EXPLANATION** (Primary Focus - 70% of response):
   - Start with a clear, comprehensive explanation of the concept or topic
   - Use the provided syllabus context to give specific, relevant examples
   - Include background information and context when helpful
   - Provide multiple perspectives or approaches when relevant
   - Use analogies and practical examples to clarify complex ideas

2. **SYLLABUS CONNECTION** (When available):
   - Explicitly reference how the topic relates to the provided syllabus content
   - Show how this concept fits into the broader course structure
   - Mention prerequisite knowledge or upcoming related topics from the syllabus

3. **PRACTICAL APPLICATION** (Supporting element):
   - Show real-world applications and relevance
   - Provide concrete examples that students can relate to
   - Demonstrate how the concept is used in professional or academic contexts

4. **MINIMAL QUESTIONING** (Only if essential):
   - Limit questions to 1 maximum per response
   - Only ask questions that genuinely help clarify the student's specific needs
   - Avoid generic "Do you understand?" type questions
   - Focus on actionable next steps rather than testing comprehension

**CONVERSATION HISTORY:**
${conversationHistory}

**STUDENT QUESTION:** "${input.message}"

**SPECIFIC INSTRUCTIONS:**
- Provide a thorough, detailed explanation (300-500 words) that fully addresses the question
- If syllabus context is provided, integrate it prominently into your explanation
- Use specific examples from the syllabus material when available
- Make connections between the current topic and broader syllabus concepts
- Prioritize teaching and explaining over questioning
- If you must ask a question, make it specific and actionable (max 1 question)
- End with practical next steps or related concepts to explore
- Be comprehensive rather than conversational

Generate a detailed educational explanation now:`;

  try {
    const chatCompletion = await ai.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are an expert educational AI tutor who excels at providing comprehensive, detailed explanations. Your strength is in thorough teaching rather than questioning. Always prioritize clear, complete explanations that integrate syllabus content when available. Minimize questions and maximize educational value through detailed explanations."
        },
        {
          role: "user", 
          content: promptText
        }
      ],
      model: input.model || "llama-3.1-8b-instant",
      temperature: 0.3, // Lower temperature for more focused, detailed explanations
      max_completion_tokens: 1536, // Increased for more comprehensive responses
      top_p: 0.8,
    });

    const outputText = chatCompletion.choices?.[0]?.message?.content || "";

    // Only check for obvious entertainment content in responses
    const entertainmentResponseCheck = /\b(celebrity gossip|entertainment news|fashion trends|social media drama)\b/i;
    if (entertainmentResponseCheck.test(outputText)) {
      return {
        response: "I'm here to provide detailed explanations on educational and academic topics. What concept or topic from your coursework would you like me to explain in depth? 📚",
        suggestions: [
          "Ask about a specific concept from your syllabus",
          "Explore a technical or theoretical topic",
          "Get detailed explanations of course material"
        ]
      };
    }

    // Generate contextual suggestions that promote deeper learning
    const generateSuggestions = (subjectArea?: string, syllabusContext?: string): string[] => {
      // If we have syllabus context, make suggestions more specific
      if (syllabusContext && syllabusContext.trim() !== "General academic and educational support") {
        return [
          "Explain related concepts from the syllabus",
          "Show practical applications of this topic",
          "Connect this to other syllabus topics"
        ];
      }

      // Subject-specific suggestions focused on deeper exploration
      if (subjectArea) {
        const subjectSuggestions: Record<string, string[]> = {
          'computer science': [
            "Explain the underlying algorithms or data structures",
            "Show implementation examples and best practices",
            "Discuss real-world applications and use cases"
          ],
          'mathematics': [
            "Demonstrate with step-by-step worked examples",
            "Explain the theoretical foundations",
            "Show applications in other fields"
          ],
          'physics': [
            "Provide visual explanations with diagrams",
            "Explain the fundamental principles",
            "Discuss real-world applications and phenomena"
          ],
          'chemistry': [
            "Explain the molecular mechanisms",
            "Show reaction pathways and processes",
            "Discuss industrial or biological applications"
          ],
          'biology': [
            "Explain the biological processes in detail",
            "Show connections to other biological systems",
            "Discuss medical or ecological applications"
          ]
        };
        
        return subjectSuggestions[subjectArea.toLowerCase()] || [
          "Provide more detailed explanations",
          "Show practical applications",
          "Explore related concepts in depth"
        ];
      }
      
      return [
        "Explain related concepts in more detail",
        "Show practical applications and examples",
        "Explore connections to other topics"
      ];
    };

    return {
      response: outputText,
      suggestions: generateSuggestions(input.subjectArea, input.syllabusContext)
    };

  } catch (e) {
    console.error("Error in educational chat flow:", e);
    return {
      response: "I'm here to provide detailed explanations on any educational topic! Whether it's from your syllabus or general academic curiosity, I can help explain concepts thoroughly with examples and practical applications. What would you like me to explain? 📚",
      suggestions: [
        "Ask for detailed concept explanations",
        "Request examples and practical applications",
        "Explore topics from your coursework"
      ]
    };
  }
};

export async function chatWithSyllabus(
  input: ChatWithSyllabusInput
): Promise<ChatWithSyllabusOutput> {
  return chatWithSyllabusFlow(input);
}
