const OpenAI = require("openai");

class OpenAIClient {
  constructor(apiKey, baseUrl = null, provider = "Google") {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl || "https://generativelanguage.googleapis.com/v1beta/";
    this.model = "gemini-2.0-flash"; // modèle par défaut
    this.provider = provider;

    this._initClient();
  }

  _initClient() {
    const config = { apiKey: this.apiKey };
    if (this.baseUrl) {
      config.baseURL = this.baseUrl; // baseURL est la bonne clé ici
    }
    this.client = new OpenAI(config);
  }

  setModel(modelName, baseUrl = null, provider = null) {
    this.model = modelName;
    if (provider) this.provider = provider;

    if (baseUrl && baseUrl !== this.baseUrl) {
      this.baseUrl = baseUrl;
      this._initClient(); // réinitialiser le client avec la nouvelle baseURL
    }
  }

  async createChatCompletion(messages, options = {}) {
    return this.client.chat.completions.create({
      model: this.model,
      messages,
      ...options,
    });
  }
}

// Fonction utilitaire pour récupérer la clé API selon le provider
function getApiKeyForProvider(provider) {
  switch (provider) {
    case "Google":
      return process.env.GOOGLE_API_KEY;
    case "Groq":
      return process.env.GROQ_API_KEY;
    default:
      return process.env.OPENAI_API_KEY;
  }
}

// Exemple d'instanciation dynamique
// Imaginons que tu as un modèle et son fournisseur
const { models } = require('../utils/models');

function createOpenAIClientForModel(modelName) {
  const model = models.find(m => m.name === modelName);
  if (!model) throw new Error("Modèle inconnu: " + modelName);

  const apiKey = getApiKeyForProvider(model.provider);
  const client = new OpenAIClient(apiKey, model.baseURL, model.provider);
  client.setModel(model.name); // mettre à jour le modèle dans le client
  return client;
}

module.exports = { OpenAIClient, createOpenAIClientForModel };
