const prisma = require('../models/prismaClient.js');

// Create
exports.createUser = async (req, res) => {
  try {
    const user = await prisma.user.create({ data: req.body });
    res.json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Read all
exports.getUsers = async (req, res) => {
  const users = await prisma.user.findMany({ include: { plan: true } });
  res.json(users);
};

// Read one
exports.getUser = async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: +req.params.id } });
  if (!user) return res.status(404).json({ error: "User not found" });
  res.json(user);
};



// Update
exports.updateUser = async (req, res) => {
  try {
    const updated = await prisma.user.update({
      where: { id: +req.params.id },
      data: req.body,
    });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Delete
exports.deleteUser = async (req, res) => {
  try {
    await prisma.user.delete({ where: { id: +req.params.id } });
    res.json({ message: "User deleted" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
