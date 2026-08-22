import type { ChatSource, ChatMessage, Language } from "@/src/types";
import { generateId } from "@/src/store/chatStore";
import { askBackend, streamAskBackend } from "@/src/services/backendService";

interface AIResponse {
  content: string;
  source: ChatSource;
  confidence: number;
  mode?: 'curriculum' | 'general' | 'safety';
}

export interface AskOptions {
  grade?: number;
  subject?: string;
  language?: Language;
}

const knowledgeBase: Array<{
  keywords: string[];
  subject: string;
  chapter: string;
  chapterNumber: number;
  grade: string;
  response: string;
}> = [
  {
    keywords: [
      "photosynthesis",
      "plant",
      "food",
      "sunlight",
      "leaf",
      "chlorophyll",
    ],
    subject: "Science",
    chapter: "Photosynthesis: How Plants Make Food",
    chapterNumber: 4,
    grade: "Grade 7",
    response:
      "Photosynthesis is the process by which green plants make their own food using sunlight, water, and carbon dioxide.\n\nHere is how it works:\n\n1. **Absorbing Sunlight**: Leaves contain a green pigment called chlorophyll, which captures sunlight.\n\n2. **Taking in Water**: Roots absorb water from the soil and transport it to the leaves through the stem.\n\n3. **Absorbing Carbon Dioxide**: Tiny pores on the leaf called stomata take in carbon dioxide from the air.\n\n4. **Making Glucose**: Using the energy from sunlight, the plant combines water and carbon dioxide to produce glucose (sugar) — its food.\n\n5. **Releasing Oxygen**: As a byproduct, oxygen is released into the air — the very oxygen we breathe!\n\nThe word equation:\n**Carbon Dioxide + Water + Sunlight → Glucose + Oxygen**\n\nThis is why plants are so important — they produce the oxygen all living things need.",
  },
  {
    keywords: [
      "cell",
      "nucleus",
      "membrane",
      "cytoplasm",
      "organelle",
      "mitochondria",
    ],
    subject: "Science",
    chapter: "Cell Structure and Function",
    chapterNumber: 3,
    grade: "Grade 7",
    response:
      'A cell is the smallest unit of life — the building block of all living things.\n\nThe main parts of a cell are:\n\n• **Cell Membrane**: The outer layer that controls what enters and leaves the cell.\n• **Nucleus**: The "brain" of the cell — it contains DNA and controls all activities.\n• **Cytoplasm**: The jelly-like substance where all organelles float.\n• **Mitochondria**: The "powerhouse" — it produces energy for the cell.\n• **Vacuole**: A storage sac for water, food, and waste.\n• **Cell Wall** (in plant cells only): A rigid outer layer that gives the cell its shape.\n• **Chloroplasts** (in plant cells only): Where photosynthesis happens.\n\nThink of a cell like a tiny factory — each part has a specific job, and they all work together to keep the organism alive.',
  },
  {
    keywords: ["fraction", "decimal", "0.75", "convert", "simplest"],
    subject: "Mathematics",
    chapter: "Fractions and Decimals",
    chapterNumber: 2,
    grade: "Grade 7",
    response:
      "Converting between fractions and decimals is straightforward!\n\n**Fraction to Decimal**: Divide the numerator (top) by the denominator (bottom).\n  Example: 3/4 = 3 ÷ 4 = 0.75\n\n**Decimal to Fraction**:\n1. Write the decimal as a fraction over a power of 10.\n   Example: 0.75 = 75/100\n2. Simplify by dividing both by their greatest common divisor (GCD).\n   GCD of 75 and 100 is 25.\n   75 ÷ 25 = 3, 100 ÷ 25 = 4\n   So 0.75 = **3/4**\n\n**Quick tip**: Memorize common conversions:\n• 1/2 = 0.5\n• 1/4 = 0.25\n• 3/4 = 0.75\n• 1/5 = 0.2\n• 1/10 = 0.1\n\nPractice makes perfect — try converting 0.6 to a fraction! (Answer: 3/5)",
  },
  {
    keywords: ["equation", "solve", "linear", "algebra", "2x", "variable"],
    subject: "Mathematics",
    chapter: "Simple Equations",
    chapterNumber: 3,
    grade: "Grade 7",
    response:
      "Solving a simple equation means finding the value of the unknown variable (usually x).\n\n**Golden Rule**: Whatever you do to one side, you must do to the other.\n\n**Example: Solve 2x + 5 = 11**\n\nStep 1: Subtract 5 from both sides.\n  2x + 5 − 5 = 11 − 5\n  2x = 6\n\nStep 2: Divide both sides by 2.\n  2x ÷ 2 = 6 ÷ 2\n  **x = 3**\n\n**Check your answer**: Put x = 3 back in.\n  2(3) + 5 = 6 + 5 = 11 ✓ Correct!\n\n**Tips**:\n• Move constants to one side first.\n• Then isolate the variable.\n• Always check by substituting your answer back in.\n\nTry this one: Solve 3x − 4 = 11. (Answer: x = 5)",
  },
  {
    keywords: [
      "himalaya",
      "mountain",
      "formation",
      "tectonic",
      "plate",
      "geology",
    ],
    subject: "Social Studies",
    chapter: "The Himalayas: Formation and Climate",
    chapterNumber: 5,
    grade: "Grade 7",
    response:
      "The Himalayas are the youngest and tallest mountain range on Earth — and they are still growing!\n\n**How did they form?**\n\nAbout 50 million years ago, the Indian Plate (carrying the Indian subcontinent) moved north and collided with the Eurasian Plate. The enormous pressure caused the land to fold and push upward, creating the Himalayan range.\n\nThis process is still happening today — the Himalayas grow about 5 millimeters every year!\n\n**Key facts about the Himalayas:**\n\n• Contains the world's highest peak — **Mount Everest (8,849 m)**\n• Spans 5 countries: Nepal, India, Bhutan, China, and Pakistan\n• Contains over 50 peaks above 7,200 meters\n• Source of major rivers: the Ganges, Indus, and Brahmaputra\n• Acts as a natural barrier affecting Nepal's climate\n\nThe Himalayas protect Nepal from cold northern winds and create diverse climate zones — from tropical in the south to arctic at the peaks.",
  },
  {
    keywords: ["tense", "past", "present", "future", "verb", "grammar"],
    subject: "English",
    chapter: "Tenses: Past, Present, Future",
    chapterNumber: 2,
    grade: "Grade 7",
    response:
      'Verb tenses tell us **when** an action happens — in the past, present, or future.\n\n**Present Tense** — happening now:\n• She **plays** cricket every day.\n• They **are studying** for the exam.\n\n**Past Tense** — already happened:\n• She **played** cricket yesterday.\n• They **were studying** last night.\n\n**Future Tense** — will happen:\n• She **will play** cricket tomorrow.\n• They **will be studying** next week.\n\n**Signal words to help you:**\n• Present: every day, now, always, usually\n• Past: yesterday, last week, ago, before\n• Future: tomorrow, next year, soon, will\n\n**Pro tip**: To form the past tense of regular verbs, just add "-ed":\n  play → played, walk → walked, study → studied\n\nIrregular verbs change completely: go → went, eat → ate, see → saw.\n\nTry it: What tense is "I will visit Pokhara next month"? (Answer: Future tense)',
  },
  {
    keywords: [
      "computer",
      "cpu",
      "hardware",
      "software",
      "processor",
      "input",
      "output",
    ],
    subject: "Computer",
    chapter: "Introduction to Computers",
    chapterNumber: 1,
    grade: "Grade 7",
    response:
      'A computer is an electronic device that processes data to produce information.\n\n**Hardware** (physical parts you can touch):\n• **CPU (Central Processing Unit)**: The "brain" — it executes all instructions.\n• **RAM**: Temporary memory that holds data while working.\n• **Storage (HDD/SSD)**: Permanent memory for saving files.\n• **Input devices**: Keyboard, mouse, microphone — send data IN.\n• **Output devices**: Monitor, speaker, printer — send data OUT.\n\n**Software** (programs you cannot touch):\n• **System software**: Operating systems like Windows, Android, Linux.\n• **Application software**: Games, browsers, MofNet!\n\n**How a computer works** (IPO cycle):\n1. **Input** — you type or click.\n2. **Process** — the CPU processes the data.\n3. **Output** — the result shows on screen.\n4. **Storage** — you can save the result for later.\n\nFun fact: Your smartphone is a powerful computer — more powerful than the computers that sent humans to the Moon!',
  },
  {
    keywords: [
      "electricity",
      "circuit",
      "current",
      "voltage",
      "wire",
      "battery",
    ],
    subject: "Science",
    chapter: "Electricity and Circuits",
    chapterNumber: 6,
    grade: "Grade 7",
    response:
      "Electricity is the flow of electrons through a conductor, and it powers almost everything we use!\n\n**A simple electric circuit needs:**\n1. **A power source** (like a battery) — provides the energy.\n2. **A conductor** (like copper wire) — carries the current.\n3. **A load** (like a bulb) — uses the electricity.\n4. **A switch** — opens or closes the circuit.\n\n**Key terms:**\n• **Current**: The flow of electric charge, measured in Amperes (A).\n• **Voltage**: The \"push\" that moves electrons, measured in Volts (V).\n• **Resistance**: Anything that slows the flow, measured in Ohms (Ω).\n\n**Ohm's Law**: V = I × R\n(Voltage = Current × Resistance)\n\n**Two types of circuits:**\n• **Series**: Components in a single line — if one breaks, all stop.\n• **Parallel**: Components on separate branches — if one breaks, others keep working.\n\nThe lights in your home are wired in parallel — that's why one broken bulb doesn't kill all the lights!",
  },
];

const fallbackResponse = (question: string): AIResponse => {
  const lower = question.toLowerCase();
  const match = knowledgeBase.find((k) =>
    k.keywords.some((kw) => lower.includes(kw)),
  );

  if (match) {
    return {
      content: match.response,
      source: {
        grade: match.grade,
        subject: match.subject,
        chapter: match.chapter,
        chapterNumber: match.chapterNumber,
      },
      confidence: 94,
    };
  }

  return {
    content: `That is a great question! Based on the Grade 7 curriculum, here is what I can share:\n\nWhile this specific topic may not be in my cached offline knowledge base, I can help you think through it. Try rephrasing your question, or ask about:\n\n• **Science**: Cells, Photosynthesis, Electricity\n• **Math**: Fractions, Equations, Data Handling\n• **Social**: The Himalayas, Democracy\n• **English**: Tenses, Grammar\n• **Computer**: Hardware, Software\n\nWhen your school hub next syncs with the mesh network, more knowledge will be available offline.\n\n*Tip: Use voice mode to ask your question in Nepali or English.*`,
    source: {
      grade: "Grade 7",
      subject: "General Knowledge",
      chapter: "Offline Knowledge Base",
      chapterNumber: 0,
    },
    confidence: 72,
  };
};

export const generateAIResponse = async (
  question: string,
  options?: AskOptions,
): Promise<AIResponse> => {
  const fromBackend = await askBackend({
    question,
    grade: options?.grade,
    subject: options?.subject,
    language: options?.language,
  });

  if (fromBackend) {
    return {
      content: fromBackend.content,
      source: fromBackend.source,
      confidence: fromBackend.confidence,
      mode: fromBackend.mode,
    };
  }

  return fallbackResponse(question);
};

const streamText = async (
  text: string,
  onChunk: (text: string) => void,
  delayMs: number,
): Promise<void> => {
  const words = text.split(" ");
  for (let i = 0; i < words.length; i++) {
    const chunk = (i === 0 ? "" : " ") + words[i];
    onChunk(chunk);
    await new Promise((r) => setTimeout(r, delayMs + Math.random() * delayMs));
  }
};

export const streamAIResponse = async (
  question: string,
  onChunk: (text: string) => void,
  onComplete: (response: AIResponse) => void,
  options?: AskOptions,
): Promise<void> => {
  console.log("[AI DEBUG] streamAIResponse called for:", question);
  const streamResult = await streamAskBackend(
    {
      question,
      grade: options?.grade,
      subject: options?.subject,
      language: options?.language,
    },
    (chunk: string) => {
      onChunk(chunk);
    },
    (_content: string, _latencyMs: number, _mode?: string, _model?: string) => {
    },
    (_error: string) => {
    },
  );

  if (streamResult) {
    const source: ChatSource = {
      grade: "Grade 7",
      subject: "Curriculum",
      chapter: "RAG Pipeline",
      chapterNumber: 0,
    };
    onComplete({
      content: streamResult.content,
      source,
      confidence: 85,
      mode: streamResult.mode,
    });
    return;
  }

  const fallback = await askBackend({
    question,
    grade: options?.grade,
    subject: options?.subject,
    language: options?.language,
  });

  if (fallback) {
    await streamText(fallback.content, onChunk, 35);
    onComplete({
      content: fallback.content,
      source: fallback.source,
      confidence: fallback.confidence,
      mode: fallback.mode,
    });
    return;
  }

  const response = fallbackResponse(question);
  await streamText(response.content, onChunk, 35);
  onComplete(response);
};

export const createUserMessage = (content: string): ChatMessage => ({
  id: generateId(),
  role: "user",
  content,
  createdAt: Date.now(),
  status: "sent",
});

export const createAssistantMessage = (
  partial?: Partial<ChatMessage>,
): ChatMessage => ({
  id: generateId(),
  role: "assistant",
  content: "",
  createdAt: Date.now(),
  status: "sending",
  ...partial,
});
