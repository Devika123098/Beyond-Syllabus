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
      response: "I'm here to help with educational topics and academic discussions. Whether you have questions about your coursework, want to explore concepts from your syllabus, or need clarification on academic topics, I'm ready to provide detailed explanations and support your learning journey.",
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

  const promptText = `You are an expert educational AI assistant with a conversational, ChatGPT-like communication style. Your goal is to provide comprehensive, flowing explanations that feel natural and engaging while maintaining educational focus.

**YOUR EXPERTISE & APPROACH:**
You are a knowledgeable academic tutor who excels at explaining complex concepts in an accessible, conversational manner. You provide detailed explanations using natural language flow, similar to how ChatGPT responds, rather than structured bullet points or rigid formatting.

**SYLLABUS CONTEXT (Primary Focus):**
${input.syllabusContext || "General educational content - provide comprehensive explanations for any academic topic"}

**SUBJECT AREA:**
${input.subjectArea || "Multi-disciplinary academic support"}

**RESPONSE STYLE GUIDELINES:**

1. **Natural Conversation Flow**: Write in natural, flowing paragraphs like ChatGPT. Avoid bullet points, numbered lists, or rigid structures unless specifically requested.

2. **Comprehensive Explanations**: Provide thorough, detailed explanations that build understanding progressively. Start with fundamentals and build to more complex ideas.

3. **Syllabus Integration**: When syllabus context is available, weave references to the course material naturally throughout your explanation. Connect the student's question to specific syllabus topics, learning objectives, or course concepts.

4. **Conversational Tone**: Use a warm, engaging tone that feels like talking to a knowledgeable friend or mentor. Use phrases like "Let me explain...", "What's interesting here is...", "You might find it helpful to think about..."

5. **Practical Examples**: Include relevant examples and analogies that make abstract concepts concrete. Draw from both the syllabus context and real-world applications.

6. **Progressive Building**: Structure your explanation to build understanding step by step, but do so through natural prose rather than numbered steps.

7. **Encouraging Language**: Use supportive, encouraging language that builds confidence. Acknowledge when topics are challenging and provide reassurance.

**CONVERSATION HISTORY:**
${conversationHistory}

**STUDENT QUESTION:** "${input.message}"

**SPECIFIC INSTRUCTIONS:**
- Write in natural, conversational paragraphs (100-250 words)
- Avoid bullet points, numbered lists, or structured formatting
- Integrate syllabus context naturally throughout your explanation when available
- Use transitional phrases to create smooth flow between ideas
- Include specific examples and applications
- Write as if you're having a friendly, educational conversation
- End with a natural closing that invites further exploration rather than formal questions

Generate a comprehensive, ChatGPT-style educational response:`;

  try {
    const chatCompletion = await ai.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are an expert educational AI assistant who communicates in a natural, conversational style similar to ChatGPT. You provide comprehensive explanations using flowing prose rather than bullet points or structured lists. Your responses should feel like engaging educational conversations that build understanding progressively through natural language flow."
        },
        {
          role: "user", 
          content: promptText
        }
      ],
      model: input.model || "llama-3.1-8b-instant",
      temperature: 0.5, // Higher for more natural, conversational responses
      max_completion_tokens: 1536, // Increased for comprehensive responses
      top_p: 0.9,
    });

    const outputText = chatCompletion.choices?.[0]?.message?.content || "";

    // Only check for obvious entertainment content in responses
    const entertainmentResponseCheck = /\b(celebrity gossip|entertainment news|fashion trends|social media drama)\b/i;
    if (entertainmentResponseCheck.test(outputText)) {
      return {
        response: "I'm here to provide detailed explanations on educational and academic topics. What concept or topic from your coursework would you like me to explore with you? I'm ready to break down complex ideas and help you understand them through clear, comprehensive explanations.",
        suggestions: [
          "Ask about a specific concept from your syllabus",
          "Explore a technical or theoretical topic",
          "Get detailed explanations of course material"
        ]
      };
    }

    // Generate natural, conversation-continuing suggestions
    const generateSuggestions = (subjectArea?: string, syllabusContext?: string): string[] => {
      // If we have syllabus context, make suggestions more specific to the course
      if (syllabusContext && syllabusContext.trim() !== "General educational content - provide comprehensive explanations for any academic topic") {
        return [
          "Can you explain how this connects to other topics in the syllabus?",
          "What are some practical applications of this concept?",
          "Could you walk me through a specific example?"
        ];
      }

      // Subject-specific suggestions that encourage deeper exploration
      if (subjectArea) {
        const subjectSuggestions: Record<string, string[]> = {
          'computer science': [
            "Can you show me how this works with a practical example?",
            "What are the real-world applications of this concept?",
            "How does this relate to other programming concepts?"
          ],
          'mathematics': [
            "Could you walk through a step-by-step example?",
            "How is this concept used in practical applications?",
            "What's the intuition behind this mathematical idea?"
          ],
          'physics': [
            "Can you explain the physical intuition behind this?",
            "What are some real-world examples of this phenomenon?",
            "How does this concept connect to other physics topics?"
          ],
          'chemistry': [
            "What's happening at the molecular level here?",
            "Can you give me some practical examples of this?",
            "How does this relate to other chemical processes?"
          ],
          'biology': [
            "How does this process work in living organisms?",
            "What are some specific examples of this in nature?",
            "How does this connect to other biological systems?"
          ]
        };
        
        return subjectSuggestions[subjectArea.toLowerCase()] || [
          "Can you provide more specific examples?",
          "How does this apply in real-world situations?",
          "What are the key takeaways I should remember?"
        ];
      }
      
      return [
        "Could you elaborate on this topic further?",
        "What are some practical examples of this?",
        "How can I apply this knowledge?"
      ];
    };

    return {
      response: outputText,
      suggestions: generateSuggestions(input.subjectArea, input.syllabusContext)
    };

  } catch (e) {
    console.error("Error in educational chat flow:", e);
    return {
      response: "I'm here to help you explore and understand any educational topic you're curious about! Whether you're working through concepts from your syllabus, trying to grasp complex theories, or just want to deepen your understanding of academic subjects, I'm ready to provide detailed, comprehensive explanations. What would you like to learn about today?",
      suggestions: [
        "Ask for detailed explanations of concepts",
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
