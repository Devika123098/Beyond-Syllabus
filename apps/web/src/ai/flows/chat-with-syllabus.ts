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
  
  // More relaxed content filtering - only block obvious non-educational content
  const isEducationalQuery = (message: string): boolean => {
    const clearlyOffTopicKeywords = [
      // Only the most obvious non-educational topics
      'messi', 'ronaldo', 'celebrity gossip', 'movie review', 'tv show',
      'dating advice', 'relationship tips', 'personal drama', 'social media drama',
      'gaming tips', 'video game', 'sports news', 'fashion trends',
      'cooking recipe', 'restaurant review', 'weekend party', 'vacation photos'
    ];

    const educationalIndicators = [
      // Broad educational terms - more inclusive
      'explain', 'help', 'understand', 'learn', 'what is', 'how to', 'why',
      'define', 'concept', 'theory', 'solve', 'calculate', 'study', 'homework',
      'assignment', 'exam', 'test', 'course', 'class', 'subject', 'topic',
      'question', 'problem', 'answer', 'solution', 'example', 'method'
    ];

    const messageLower = message.toLowerCase();
    
    // Only block if it contains clearly off-topic keywords
    const hasObviousOffTopic = clearlyOffTopicKeywords.some(keyword => 
      messageLower.includes(keyword)
    );
    
    // Allow if it has educational indicators OR is a general question
    const hasEducationalContent = educationalIndicators.some(keyword => 
      messageLower.includes(keyword)
    );

    // Be more permissive - allow questions that aren't obviously off-topic
    return !hasObviousOffTopic && (hasEducationalContent || messageLower.length > 5);
  };

  // Only block clearly non-educational queries
  if (!isEducationalQuery(input.message)) {
    return {
      response: "I'm focused on helping with educational topics and academic questions. Could you ask me about something related to your studies or coursework? I'm here to help with learning! 📚",
      suggestions: [
        "Ask me to explain a concept",
        "Help with a study problem",
        "Clarify course material"
      ]
    };
  }

  const conversationHistory = input.history
    .map((msg) => `${msg.role}: ${msg.content}`)
    .join("\n");

  const promptText = `You are a helpful educational AI tutor focused on academic learning and study support.

**YOUR ROLE:**
- Educational AI assistant specializing in learning support
- Help students understand concepts, solve problems, and study effectively
- Provide clear explanations and practical guidance for academic topics
- Maintain a supportive and encouraging learning environment

**GUIDELINES:**
- Answer educational and academic questions directly and helpfully
- If asked about clearly non-educational topics (celebrity gossip, entertainment news, personal drama), politely redirect to educational content
- For ambiguous questions, interpret them in an educational context when possible
- Keep explanations clear, structured, and student-friendly
- Use examples and analogies to make concepts easier to understand

**SYLLABUS CONTEXT:**
${input.syllabusContext || "General academic and educational support"}

**SUBJECT AREA:**
${input.subjectArea || "Various academic subjects"}

**TEACHING APPROACH:**
1. 📚 **UNDERSTAND**: Identify what the student is asking and the learning goal
2. 🎯 **EXPLAIN**: Provide clear, structured explanations with examples
3. 🧠 **ENGAGE**: Ask questions or provide practice to reinforce learning
4. ✅ **SUPPORT**: Offer encouragement and additional resources when helpful

**CONVERSATION HISTORY:**
${conversationHistory}

**STUDENT QUESTION:** "${input.message}"

**INSTRUCTIONS:**
- Provide a helpful, educational response to the student's question
- Keep your response focused but comprehensive (150-300 words)
- Use a friendly, supportive tone that encourages learning
- End with 1-2 follow-up questions or suggestions to deepen understanding
- If the question is vague, ask clarifying questions to provide better help

Respond to help the student learn:`;

  try {
    const chatCompletion = await ai.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are a helpful educational AI tutor. Focus on providing educational support and learning assistance. For clearly non-educational questions, politely redirect to academic topics, but be flexible and helpful for questions that could have educational value."
        },
        {
          role: "user", 
          content: promptText
        }
      ],
      model: input.model || "llama-3.1-8b-instant",
      temperature: 0.5, // Increased slightly for more natural responses
      max_completion_tokens: 1024,
      top_p: 0.85,
    });

    const outputText = chatCompletion.choices?.[0]?.message?.content || "";

    // Only check for the most obvious non-educational content
    const obviousOffTopicCheck = /\b(celebrity gossip|dating advice|party planning|social media drama)\b/i;
    if (obviousOffTopicCheck.test(outputText)) {
      return {
        response: "I'm here to help with educational topics and learning. Is there something academic or study-related I can assist you with? 📚",
        suggestions: [
          "Ask about a concept you're learning",
          "Get help with homework or assignments",
          "Explore topics from your coursework"
        ]
      };
    }

    // Generate helpful suggestions
    const generateSuggestions = (subjectArea?: string): string[] => {
      if (subjectArea) {
        const subjectSuggestions: Record<string, string[]> = {
          'computer science': [
            "Can you walk through this step-by-step?",
            "Show me a practical example",
            "How does this concept apply in real projects?"
          ],
          'mathematics': [
            "Can you solve a similar problem?",
            "What's another way to approach this?",
            "How is this used in real applications?"
          ],
          'physics': [
            "Can you explain with a visual example?",
            "What are the key principles here?",
            "How does this work in practice?"
          ],
          'chemistry': [
            "Can you show the step-by-step process?",
            "What happens if we change the conditions?",
            "How is this used in real applications?"
          ],
          'biology': [
            "Can you explain this with an example?",
            "How does this connect to other concepts?",
            "What's the practical significance?"
          ]
        };
        
        return subjectSuggestions[subjectArea.toLowerCase()] || [
          "Can you explain this differently?",
          "Give me more examples",
          "How does this connect to other topics?"
        ];
      }
      
      return [
        "Can you explain this in more detail?",
        "Show me a practical example",
        "How can I apply this knowledge?"
      ];
    };

    return {
      response: outputText,
      suggestions: generateSuggestions(input.subjectArea)
    };

  } catch (e) {
    console.error("Error in educational chat flow:", e);
    return {
      response: "I'm having some trouble right now, but I'm here to help with your learning! Could you try rephrasing your question? I'd be happy to explain concepts, help with problems, or assist with your studies. 📚",
      suggestions: [
        "Try asking your question differently",
        "Ask about a specific topic or concept",
        "Let me know what subject you're working on"
      ]
    };
  }
};

export async function chatWithSyllabus(
  input: ChatWithSyllabusInput
): Promise<ChatWithSyllabusOutput> {
  return chatWithSyllabusFlow(input);
}
