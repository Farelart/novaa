const prisma = require('../models/prismaClient.js');

const chatService = require('../AiServices/chatService.js');

exports.handleChatMessage = async (req, res) => {
  try {
    const { conversationId, userMessage, model, baseURL, temperature, max_token, instruction } = req.body;
    console.log('Received request body:', req.body);
    
    if (!conversationId || !userMessage) {
      return res.status(400).json({ error: 'conversationId and userMessage are required' });
    }
    console.log('handleChatMessage called with:', { conversationId, userMessage, model, baseURL, temperature, max_token, instruction });
    const reply = await chatService.handleChatMessage(conversationId, userMessage, { model:model, baseURL:baseURL, temperature:temperature, max_token:max_token,instruction:instruction });
    
    res.json({ reply });
  } catch (error) {
    console.error('Erreur chatController:', error);
    res.status(500).json({ error: error.message });
  }
};

// --- Conversations ---

exports.getConversations = async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const conversations = await prisma.conversation.findMany({
      where: { userId },
      include: { messages: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json(conversations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getConversationById = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const conversation = await prisma.conversation.findUnique({
      where: { id },
      include: {
        messages: {
          include: { attachments: true },
          orderBy: { createdAt: 'asc' }
        },
      },
    });
    if (!conversation) return res.status(404).json({ error: 'Conversation not found' });
    res.json(conversation);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createConversation = async (req, res) => {
  try {
    const { userId, title } = req.body;
    const conversation = await prisma.conversation.create({
      data: { userId, title },
    });
    res.status(201).json(conversation);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};



exports.updateConversation = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { title, instruction, model, temperature } = req.body;

    const updatedConversation = await prisma.conversation.update({
      where: { id },
      data: { title, instruction , model, temperature},
    });

    res.json(updatedConversation);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


exports.deleteConversation = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    console.log('Deleting conversation with ID:', id);
    await prisma.conversation.delete({ where: { id } });
    console.log('Conversation deleted:', id);
    res.json({ message: 'Conversation deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// --- Messages ---

exports.getMessagesByConversation = async (req, res) => {
  try {
    const conversationId = parseInt(req.params.conversationId);
    const messages = await prisma.message.findMany({
      where: { conversationId },
      include: { attachments: true },
      orderBy: { createdAt: 'asc' },
    });
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createMessage = async (req, res) => {
  try {
    const { conversationId, role, content, toolCall, attachments } = req.body;

    const message = await prisma.message.create({
      data: {
        conversationId,
        role,
        content,
        toolCall,
        attachments: attachments
          ? {
              create: attachments.map((att) => ({
                type: att.type,
                url: att.url,
                name: att.name,
              })),
            }
          : undefined,
      },
      include: { attachments: true },
    });

    res.status(201).json(message);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteMessage = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    console.log('Deleting message with ID:', id);
    await prisma.message.delete({ where: { id } });
    console.log('Message deleted:', id);
    res.json({ message: 'Message deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// --- Attachments ---

exports.getAttachment = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const attachment = await prisma.attachment.findUnique({ where: { id } });
    if (!attachment) return res.status(404).json({ error: 'Attachment not found' });
    res.json(attachment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteAttachment = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await prisma.attachment.delete({ where: { id } });
    res.json({ message: 'Attachment deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
