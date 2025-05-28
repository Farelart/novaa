const prisma = require('../models/prismaClient.js');
const {createOpenAIClientForModel} = require('./openaiClient');
const tools = require('./tools');
const modelList = require('../utils/models.js');
const { and } = require('mathjs');
// Définition des outils disponibles
const availableTools = [
    {
        "type": "function",
        "function": {
            "name": "save_user_info",
            "description": "Saves user information in the database to enhance future interactions",
            "parameters": {
            "type": "object",
            "properties": {
                "information": {
                "type": "string",
                "description": "The information to save about the user, such as preferences, interests, or any other relevant data that could enhance current and future conversations.",
                }
            },
            "required": ["information"],
            },
        }
    }
];

const summarizationTools = [
  {
    "type": "function",
    "function": {
      "name": "summarize_memory",
      "description": "Summarize the user memory to keep the most important facts only.",
      "parameters": {
        "type": "object",
        "properties": {
          "summary": {
            "type": "string",
            "description": "The concise and useful summary of the user's memory. Max 10,000 characters.",
          },
        },
        "required": ["summary"],
      },
    }
  }
];


// Map des fonctions réelles
const toolFunctions = {
};

async function ProcessMessage(userId,message,model){
  const messagesForOpenAI = [];
  messagesForOpenAI.push({
    role: 'system',
    content: "You are a helpful assistant.Your task is to see wether the prompt contains useful informations about the user that could help to enhance user experience in the future. If you find any information that could be useful, please save it in the database by calling the adequate tool.",
  });
  messagesForOpenAI.push({
    role: 'user',
    content: message,
  });
  const openaiClient = createOpenAIClientForModel(model);
  const completion = await openaiClient.createChatCompletion(messagesForOpenAI, {
    temperature:  0.7,
    max_tokens: 1000,
    tools: availableTools,
    tool_choice: "auto" 
  });
  const assistantMessage = completion.choices[0].message;
  
  console.log('assistantMessage:', assistantMessage);
  if (Array.isArray(assistantMessage.tool_calls)) {
    for (const toolCall of assistantMessage.tool_calls) {
      try {
        const functionName = toolCall.function.name;
        const functionArgs = JSON.parse(toolCall.function.arguments);       
        if (functionName=== "save_user_info" && functionArgs.information) {  
          const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { Memory: true }
          });
          const existingMemory = user?.Memory || '';
          let newMemory = existingMemory + "\n" + functionArgs.information;

          // ⚠️ Si la mémoire dépasse 3 000 caractères → résumer
          if (newMemory.length > 3000) {
            console.log("🧠 Memory too large. Summarizing...");

            const summarizationPrompt = [
              {
                role: 'system',
                content: "You are an assistant that summarizes user memory. Summarize the following information to retain only the most important facts to help personalize the user's experience in the future. The summary should be clear, concise, and no longer than 3000 characters.",
              },
              {
                role: 'user',
                content: newMemory,
              }
            ];

            const summarization = await openaiClient.createChatCompletion(summarizationPrompt, {
              temperature: 0.3,
              max_tokens: 2000, // adapt if needed
            });

            const summarizedMemory = summarization.choices[0].message.content.trim();
            newMemory = summarizedMemory.slice(0, 10000); // max 10k après résumé
          }

          console.log(`💾 Saving user information for userId: ${userId}`);
          await prisma.user.update({
            where: { id: userId },
            data: {
              Memory: newMemory
            }
          });
        }
      } catch (error) {
        console.error(`Erreur lors de l'exécution de l'outil ${toolCall.function.name}:`, error);
      }
    }
  }

  
}


async function handleChatMessage(conversationId, userMessage, options = {}) {
  try {
    // 1. Récupérer l'historique des messages
    let user = null;

    // 1. Essayer via l'historique des messages
    const messagesHistory = await prisma.message.findMany({
      where: { conversationId },
      include: {
        conversation: {
          include: { user: true }
        }
      }
    });

    if (messagesHistory.length > 0) {
      user = messagesHistory[0].conversation.user;
    } else {
      const conversation = await prisma.conversation.findUnique({
        where: { id: conversationId },
        include: { user: true }
      });
      user = conversation?.user;
    }
    const memory = user?.Memory ?? '';
    console.log('memory:', memory);
    // 2. Préparer les messages pour OpenAI
    const messagesForOpenAI = [];
    if (options.instruction || memory) {
      const systemMessageContent = [
        memory ? `Here is some information about the user:\n${memory}` : '',
        options.instruction ? `\nInstructions:First of all never put a tag in your response\n${options.instruction}` : ''
      ].filter(Boolean).join('\n\n');
      messagesForOpenAI.push({
        role: 'system',
        content: systemMessageContent,
      });
    }

    messagesForOpenAI.push(
      ...messagesHistory.map(m => ({
        role: m.role,
        content: m.content,
        ...(m.toolCall && { tool_calls: JSON.parse(m.toolCall) }),
      }))
    );

    messagesForOpenAI.push({ role: 'user', content: userMessage });

    console.log('messagesForOpenAI last:', messagesForOpenAI);

    // 3. Configuration OpenAI avec outils
    const openaiClient = createOpenAIClientForModel(options.model);
    
    const completion = await openaiClient.createChatCompletion(messagesForOpenAI, {
      temperature: options.temperature ?? 0.7,
      max_tokens: options.max_tokens ?? 1000,
    });
    console.log('assistantMessage:', completion.choices);
    const assistantMessage = completion.choices[0].message;
    

    // 4. Sauvegarder le message utilisateur
    const userMsg = await prisma.message.create({
      data: { 
        conversationId, 
        role: 'user', 
        content: userMessage 
      },
    });
    // 6. Pas d'outils nécessaires, sauvegarder la réponse directe
    const assistantMsg = await prisma.message.create({
      data: {
        conversationId,
        role: 'assistant',
        content: assistantMessage.content
      },
    });

    ProcessMessage(1, userMessage, options.model);
    return {content:assistantMessage.content, userMsgId: userMsg.id, assistantMsgId: assistantMsg.id};

  } catch (error) {
    console.error('Erreur dans handleChatMessage:', error);
    throw new Error('Erreur lors du traitement du message');
  }
}

// Fonction pour ajouter dynamiquement de nouveaux outils
function addTool(toolDefinition, toolFunction) {
  availableTools.push(toolDefinition);
  toolFunctions[toolDefinition.function.name] = toolFunction;
}

// Fonction pour lister les outils disponibles
function listAvailableTools() {
  return availableTools.map(tool => ({
    name: tool.function.name,
    description: tool.function.description
  }));
}

module.exports = { 
  handleChatMessage, 
  addTool, 
  listAvailableTools 
};