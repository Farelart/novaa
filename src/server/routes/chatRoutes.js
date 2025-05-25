const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController')


// Conversations
router.get('/users/:userId/conversations', chatController.getConversations);
router.get('/conversations/:id', chatController.getConversationById);
router.put('/conversations/:id', chatController.updateConversation);
router.post('/conversations', chatController.createConversation);
router.delete('/conversations/:id', chatController.deleteConversation);

// Messages
router.get('/conversations/:conversationId/messages', chatController.getMessagesByConversation);
router.post('/messages', chatController.createMessage);
router.delete('/messages/:id', chatController.deleteMessage);

// Attachments
router.get('/attachments/:id', chatController.getAttachment);
router.delete('/attachments/:id', chatController.deleteAttachment);

//handle chat
router.post('/handle-chat', chatController.handleChatMessage)

module.exports = router;
