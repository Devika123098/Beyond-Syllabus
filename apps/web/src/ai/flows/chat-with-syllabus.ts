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
  syllabusContext?: string; // Added for syllabus-specific context
  subjectArea?: string; // Added to define subject boundaries
}

export interface ChatWithSyllabusOutput {
  response: string;
  suggestions?: string[];
}

const chatWithSyllabusFlow = async (
  input: ChatWithSyllabusInput
): Promise<ChatWithSyllabusOutput> => {
  
  // Enhanced content filtering for syllabus relevance
  const isSyllabusRelevant = (message: string, subjectArea?: string): boolean => {
    const offTopicKeywords = [
      // Celebrities & Entertainment
      'messi', 'ronaldo', 'celebrity', 'actor', 'singer', 'movie', 'film', 'tv show',
      'netflix', 'youtube', 'instagram', 'tiktok', 'social media', 'influencer',
      // Sports & Games
      'football', 'soccer', 'basketball', 'cricket', 'tennis', 'gaming', 'game',
      'video game', 'esports', 'fifa', 'fortnite',
      // Personal & Social
      'dating', 'relationship', 'personal life', 'gossip', 'fashion', 'beauty',
      'lifestyle', 'travel', 'vacation', 'party', 'weekend plans',
      // Non-academic topics
      'politics', 'religion', 'current events', 'news', 'weather', 'food recipe',
      'cooking', 'restaurant', 'shopping', 'money advice', 'investment'
    ];

    const academicKeywords = [
      // Core academic terms
      'explain', 'define', 'concept', 'theory', 'formula', 'equation', 'solve',
      'calculate', 'understand', 'learn', 'study', 'homework', 'assignment',
      'exam', 'test', 'quiz', 'chapter', 'lesson', 'course', 'syllabus',
      // Subject-specific indicators
      'algorithm', 'function', 'variable', 'analysis', 'research', 'experiment',
      'theorem', 'proof', 'method', 'principle', 'law', 'rule', 'property'
    ];

    const messageLower = message.toLowerCase();
    
    // Check for off-topic content
    const hasOffTopic = offTopicKeywords.some(keyword => 
      messageLower.includes(keyword)
    );
    
    // Check for academic content
    const hasAcademic = academicKeywords.some(keyword => 
      messageLower.includes(keyword)
    );

    // If subject area is specified, check relevance
    if (subjectArea) {
      const subjectKeywords = getSubjectKeywords(subjectArea);
      const hasSubjectRelevance = subjectKeywords.some(keyword => 
        messageLower.includes(keyword)
      );
      return !hasOffTopic && (hasAcademic || hasSubjectRelevance);
    }

    return !hasOffTopic && (hasAcademic || messageLower.length > 10);
  };

  // Helper function to get subject-specific keywords
  const getSubjectKeywords = (subject: string): string[] => {
    const subjectMaps: Record<string, string[]> = {
      'computer science': ['programming', 'coding', 'algorithm', 'data structure', 'database', 'software', 'computer', 'java', 'python', 'javascript'],
      'mathematics': ['math', 'algebra', 'calculus', 'geometry', 'statistics', 'probability', 'equation', 'derivative', 'integral'],
      'physics': ['force', 'energy', 'momentum', 'wave', 'particle', 'quantum', 'mechanics', 'electricity', 'magnetism'],
      'chemistry': ['molecule', 'atom', 'reaction', 'compound', 'element', 'periodic', 'bond', 'organic', 'inorganic'],
      'biology': ['cell', 'organism', 'genetics', 'evolution', 'ecosystem', 'protein', 'dna', 'species', 'metabolism']
    };
    
    const subjectLower = subject.toLowerCase();
    return subjectMaps[subjectLower] || [];
  };

  // Check if query is syllabus-relevant
  if (!isSyllabusRelevant(input.message, input.subjectArea)) {
    return {
      response: "I'm a specialized academic tutor focused exclusively on helping with your syllabus and coursework. I can only assist with educational topics related to your studies. Please ask me about concepts, assignments, or topics from your curriculum! 📚",
      suggestions: [
        "Explain a concept from your syllabus",
        "Help solve a practice problem",
        "Clarify course material or assignments"
      ]
    };
  }

  const conversationHistory = input.history
    .map((msg) => `${msg.role}: ${msg.content}`)
    .join("\n");

  const promptText = `You are a specialized academic tutor with STRICT EDUCATIONAL BOUNDARIES. You must ONLY respond to questions directly related to the provided syllabus and academic coursework.

**IDENTITY & CONSTRAINTS:**
- Role: Syllabus-focused Academic Tutor
- Scope: ONLY topics covered in the student's curriculum and course materials
- Boundaries: NEVER discuss celebrities, sports, entertainment, personal topics, or any non-academic subjects
- Mission: Make syllabus content clear, engaging, and confidence-building

**MANDATORY CONTENT FILTERING:**
- If asked about non-syllabus topics (celebrities like Messi/Ronaldo, sports, movies, personal questions, etc.), respond: "I focus exclusively on your academic syllabus and coursework. Please ask me about topics from your curriculum."
- ALWAYS redirect off-topic questions back to syllabus content
- You are NOT a general chatbot - you are a CURRICULUM-SPECIFIC tutor

**SYLLABUS CONTEXT:**
${input.syllabusContext || "Focus on the student's specific course materials and curriculum"}

**SUBJECT AREA:**
${input.subjectArea || "General academic subjects as per syllabus"}

**STRUCTURED TEACHING APPROACH:**

📋 **Action Plan** (Start each response with 3-5 bullet points outlining your approach):
- Assess if question relates to syllabus content
- Break down the concept into digestible parts
- Provide clear explanation with relevant examples
- Create practice opportunity
- Reinforce understanding

**Teaching Workflow:**
1. 🎯 **ASSESS**: Confirm the topic is syllabus-relevant and identify key learning objectives
2. 🧑‍🏫 **TEACH**: Provide clear, structured explanation using syllabus terminology and concepts
   - Use examples from the course material when possible
   - Keep explanations focused and concise (100-200 words)
3. 📝 **PRACTICE**: Create a short, syllabus-aligned practice problem or question
   - Make it relevant to course assessments
   - Offer hints if requested
4. ✅ **CHECK**: Review answers with step-by-step reasoning
   - Highlight common misconceptions from the subject area
   - Connect back to syllabus learning objectives
5. 🔄 **REFLECT**: Encourage learner to explain the concept in their own words

**RESPONSE GUIDELINES:**
- Maximum 250 words per response to maintain focus
- Use bullet points for clarity
- Include ONE relevant emoji per section (maximum 3 total)
- End with 2-3 follow-up questions that deepen syllabus understanding
- Stay within the bounds of the provided curriculum

**CONVERSATION HISTORY:**
${conversationHistory}

**STUDENT QUESTION:** "${input.message}"

**INSTRUCTIONS:**
1. Verify this question relates to syllabus content
2. If non-syllabus, redirect to curriculum topics
3. If syllabus-relevant, follow the structured teaching approach above
4. Keep all content within the academic scope provided

Generate your tutoring response now:`;

  try {
    const chatCompletion = await ai.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are a syllabus-focused academic tutor who ONLY helps with curriculum-related topics and coursework. You must refuse to discuss any non-academic subjects and always redirect to syllabus content."
        },
        {
          role: "user", 
          content: promptText
        }
      ],
      model: input.model || "llama-3.1-8b-instant",
      temperature: 0.3, // Lower for more consistent, focused responses
      max_completion_tokens: 1024, // Reduced for concise responses
      top_p: 0.8,
    });

    const outputText = chatCompletion.choices?.[0]?.message?.content || "";

    // Additional safety check for non-academic content
    const offTopicCheck = /\b(messi|ronaldo|celebrity|entertainment|sports|movie|politics|dating|gaming)\b/i;
    if (offTopicCheck.test(outputText)) {
      return {
        response: "I'm designed to focus exclusively on your syllabus and academic coursework. Let's discuss topics from your curriculum instead! What concept from your course materials would you like me to explain? 📚",
        suggestions: [
          "Ask about a specific chapter or topic",
          "Request help with course assignments",
          "Clarify concepts from your syllabus"
        ]
      };
    }

    // Generate contextual suggestions based on subject area
    const generateSuggestions = (subjectArea?: string): string[] => {
      const baseSuggestions = [
        "Can you explain this topic differently?",
        "Give me a practice problem on this",
        "What are common mistakes to avoid?"
      ];

      if (subjectArea) {
        const subjectSuggestions: Record<string, string[]> = {
          'computer science': [
            "Show me the algorithm step-by-step",
            "Can you trace through this code?",
            "What's the time complexity?"
          ],
          'mathematics': [
            "Show me another example problem",
            "What's the underlying principle?",
            "How do I apply this formula?"
          ],
          'physics': [
            "Can you draw a diagram?",
            "What are the key equations?",
            "How does this apply in real scenarios?"
          ]
        };
        
        return subjectSuggestions[subjectArea.toLowerCase()] || baseSuggestions;
      }
      
      return baseSuggestions;
    };

    return {
      response: outputText,
      suggestions: generateSuggestions(input.subjectArea)
    };

  } catch (e) {
    console.error("Error in syllabus chat flow:", e);
    return {
      response: "I'm having trouble processing your academic query. Please try rephrasing your question about the course material, and I'll help you understand the syllabus content better! 📚",
      suggestions: [
        "Ask about a specific course topic",
        "Request clarification on assignments",
        "Inquire about syllabus concepts"
      ]
    };
  }
};

export async function chatWithSyllabus(
  input: ChatWithSyllabusInput
): Promise<ChatWithSyllabusOutput> {
  return chatWithSyllabusFlow(input);
}
