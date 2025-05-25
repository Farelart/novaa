const prisma = require('../models/prismaClient.js');
const {createOpenAIClientForModel} = require('./openaiClient');
const tools = require('./tools');
const modelList = require('../utils/models.js')
// Définition des outils disponibles
const availableTools = [
    {
        "type": "function",
        "function": {
            "name": "get_weather",
            "description": "Get the weather in a given location",
            "parameters": {
            "type": "object",
            "properties": {
                "location": {
                "type": "string",
                "description": "The city and state, e.g. Chicago, IL",
                },
                "unit": {"type": "string", "enum": ["celsius", "fahrenheit"]},
            },
            "required": ["location"],
            },
        }
    },
    {
        "type": "function",
        "function": {
            "name": "calculator",
            "description": "Perform basic arithmetic operations",
            "parameters": {
                "type": "object",
                "properties": {
                    "expression": {
                        "type": "string",
                        "description": "The arithmetic expression to evaluate, e.g., '2 + 2'",
                    },
                },
                "required": ["expression"],
            },
        },
    }
];

// Map des fonctions réelles
const toolFunctions = {
  calculator: tools.calculatorTool,
  get_weather: tools.weatherTool,
};

function getBaseURLFromModelName(modelName) {
  const model = modelList.find(m => m.name === modelName);
  return model ? model.baseURL : null;
}
function getProviderFromModelName(modelName) {
  const model = modelList.find(m => m.name === modelName);
  return model ? model.baseURL : null;
}

async function handleChatMessage(conversationId, userMessage, options = {}) {
  try {
    console.log('params:', { conversationId, userMessage, options });
    // 1. Récupérer l'historique des messages
    const messagesHistory = await prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
    });

    


    // 2. Préparer les messages pour OpenAI
    const messagesForOpenAI = [];

    if (options.instruction) {
      messagesForOpenAI.push({
        role: 'system',
        content: options.instruction,
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

    console.log('messagesForOpenAI:', messagesForOpenAI);

    // 3. Configuration OpenAI avec outils
    const openaiClient = createOpenAIClientForModel(options.model);
    
    const completion = await openaiClient.createChatCompletion(messagesForOpenAI, {
      temperature: options.temperature ?? 0.7,
      max_tokens: options.max_tokens ?? 1000,
      tools: availableTools,
      tool_choice: "auto" // L'IA décide si elle a besoin d'outils
    });
    console.log('assistantMessage:', completion.choices);
    const assistantMessage = completion.choices[0].message;
    

    // 4. Sauvegarder le message utilisateur
    await prisma.message.create({
      data: { 
        conversationId, 
        role: 'user', 
        content: userMessage 
      },
    });

    // 5. Traiter les appels d'outils si nécessaire
    if (assistantMessage.tool_calls) {
      // Sauvegarder le message assistant avec tool_calls
      await prisma.message.create({
        data: {
          conversationId,
          role: 'assistant',
          content: assistantMessage.content || '',
          toolCall: JSON.stringify(assistantMessage.tool_calls)
        },
      });

      // Exécuter chaque outil appelé
      const toolResults = [];
      for (const toolCall of assistantMessage.tool_calls) {
        try {
          const functionName = toolCall.function.name;
          const functionArgs = JSON.parse(toolCall.function.arguments);
          
          if (toolFunctions[functionName]) {
            const result = await toolFunctions[functionName](functionArgs);
            
            toolResults.push({
              role: 'tool',
              content: JSON.stringify(result),
              tool_call_id: toolCall.id
            });
          }
        } catch (error) {
          console.error(`Erreur lors de l'exécution de l'outil ${toolCall.function.name}:`, error);
          toolResults.push({
            role: 'tool',
            content: JSON.stringify({ error: "Erreur lors de l'exécution de l'outil" }),
            tool_call_id: toolCall.id
          });
        }
      }

      // Si des outils ont été exécutés, faire un nouvel appel à OpenAI avec les résultats
      if (toolResults.length > 0) {
        const finalMessages = [...messagesForOpenAI, assistantMessage, ...toolResults];
        
        const finalCompletion = await openaiClient.createChatCompletion(finalMessages, {
          temperature: options.temperature ?? 0.7,
          max_tokens: options.max_tokens ?? 1000,
        });

        const finalAssistantMessage = finalCompletion.choices[0].message.content;

        // Sauvegarder la réponse finale
        await prisma.message.create({
          data: {
            conversationId,
            role: 'assistant',
            content: finalAssistantMessage
          },
        });

        return finalAssistantMessage;
      }
    }

    // 6. Pas d'outils nécessaires, sauvegarder la réponse directe
    await prisma.message.create({
      data: {
        conversationId,
        role: 'assistant',
        content: assistantMessage.content
      },
    });

    return assistantMessage.content;

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