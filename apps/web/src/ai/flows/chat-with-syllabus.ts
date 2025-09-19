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
    
    // Only block if it's clearly pure entertainment content
    return pureEntertainmentKeywords.some(keyword => 
      messageLower.includes(keyword)
    );
  };

  // Only block obvious entertainment queries
  if (isEntertainmentQuery(input.message)) {
    return {
      response: "I focus on educational topics, academic questions, and technical discussions. Could you ask me about something related to learning, technology, or knowledge? I'm here to help with educational content! 📚",
      suggestions: [
        "Ask about a concept or topic",
        "Get help with technical questions",
        "Explore academic subjects"
      ]
    };
  }

  const conversationHistory = input.history
    .map((msg) => `${msg.role}: ${msg.content}`)
    .join("\n");

  const promptText = `You are a comprehensive educational and knowledge assistant focused on learning, academics, technology, and intellectual topics.

**YOUR ROLE:**
- Educational AI assistant specializing in all forms of learning and knowledge
- Help with academic subjects, technical topics, scientific concepts, and intellectual discussions
- Provide clear explanations for educational, technical, scientific, historical, and general knowledge questions
- Support learning across all disciplines including STEM, humanities, social sciences, and professional fields
- Maintain a supportive and encouraging learning environment

**SCOPE OF ASSISTANCE:**
- All academic subjects and educational topics
- Technology, programming, and computer science
- Science, mathematics, engineering, and research
- History, literature, philosophy, and social sciences
- Professional development and career guidance
- Technical troubleshooting and how-to questions
- General knowledge and intellectual curiosity
- Study skills and learning strategies

**GUIDELINES:**
- Answer educational, technical, and knowledge-based questions directly and helpfully
- Only avoid pure entertainment content (celebrity gossip, entertainment news, etc.)
- For any question that could have educational value, provide a thoughtful response
- Include practical examples, analogies, and clear explanations
- Encourage deeper learning and critical thinking
- Adapt your response style to match the question's complexity level

**SYLLABUS CONTEXT:**
${input.syllabusContext || "General educational and technical support"}

**SUBJECT AREA:**
${input.subjectArea || "Various academic and technical subjects"}

**TEACHING APPROACH:**
1. 📚 **UNDERSTAND**: Identify the learning goal or knowledge need
2. 🎯 **EXPLAIN**: Provide comprehensive, clear explanations with context
3. 🧠 **EXPAND**: Connect concepts to broader knowledge or applications
4. ✅ **SUPPORT**: Offer resources, next steps, or related topics for further learning

**CONVERSATION HISTORY:**
${conversationHistory}

**QUESTION:** "${input.message}"

**INSTRUCTIONS:**
- Provide a helpful, comprehensive response to the question
- Treat any question with potential educational or knowledge value seriously
- Keep explanations clear but thorough (200-400 words as needed)
- Use examples, analogies, or practical applications when helpful
- Include relevant background context or related concepts
- End with suggestions for deeper exploration or related questions
- If the question is broad, break it down into manageable parts

Respond to help with learning and knowledge:`;

  try {
    const chatCompletion = await ai.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are a comprehensive educational and knowledge assistant. Help with any topic that has educational, technical, or intellectual value. Only avoid pure entertainment content like celebrity gossip or entertainment news. Be thorough, accurate, and encouraging in your responses."
        },
        {
          role: "user", 
          content: promptText
        }
      ],
      model: input.model || "llama-3.1-8b-instant",
      temperature: 0.6, // Higher for more natural, comprehensive responses
      max_completion_tokens: 1536, // Increased for more detailed responses
      top_p: 0.9,
    });

    const outputText = chatCompletion.choices?.[0]?.message?.content || "";

    // Only check for obvious entertainment content in responses
    const entertainmentResponseCheck = /\b(celebrity gossip|entertainment news|fashion trends|social media drama)\b/i;
    if (entertainmentResponseCheck.test(outputText)) {
      return {
        response: "I'm here to help with educational, technical, and knowledge-based topics. Is there something academic, technical, or intellectually interesting I can help you explore? 📚",
        suggestions: [
          "Ask about a concept or theory",
          "Get help with technical questions",
          "Explore academic or professional topics"
        ]
      };
    }

    // Generate comprehensive suggestions based on topic area
    const generateSuggestions = (subjectArea?: string, originalMessage?: string): string[] => {
      // Technology and CS suggestions
      if (subjectArea?.toLowerCase().includes('computer') || originalMessage?.toLowerCase().includes('programming') || originalMessage?.toLowerCase().includes('code')) {
        return [
          "Can you explain the underlying concepts?",
          "Show me practical examples or applications",
          "What are best practices for this?"
        ];
      }

      // Science and Math suggestions
      if (subjectArea?.toLowerCase().includes('math') || subjectArea?.toLowerCase().includes('science') || originalMessage?.toLowerCase().includes('equation') || originalMessage?.toLowerCase().includes('formula')) {
        return [
          "Can you walk through a step-by-step example?",
          "How is this applied in real-world scenarios?",
          "What are the key principles behind this?"
        ];
      }

      // General academic suggestions
      if (subjectArea || originalMessage?.toLowerCase().includes('study') || originalMessage?.toLowerCase().includes('learn')) {
        return [
          "Can you explain this concept in more depth?",
          "What are related topics I should explore?",
          "How does this connect to other areas?"
        ];
      }

      // Default comprehensive suggestions
      return [
        "Can you provide more details or examples?",
        "What are the practical applications of this?",
        "How can I learn more about this topic?"
      ];
    };

    return {
      response: outputText,
      suggestions: generateSuggestions(input.subjectArea, input.message)
    };

  } catch (e) {
    console.error("Error in educational chat flow:", e);
    return {
      response: "I'm having some technical difficulties, but I'm here to help with your questions! Could you try rephrasing your question? I'm ready to assist with educational topics, technical questions, or any knowledge-based discussions. 📚",
      suggestions: [
        "Try rephrasing your question",
        "Ask about a specific concept or topic",
        "Let me know what subject area you're interested in"
      ]
    };
  }
};

export async function chatWithSyllabus(
  input: ChatWithSyllabusInput
): Promise<ChatWithSyllabusOutput> {
  return chatWithSyllabusFlow(input);
}
