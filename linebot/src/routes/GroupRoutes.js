const express = require('express');
const router = express.Router();

const Group = require('../controllers/GruopController')

router.get('/', async (req, res) => {
    const groups = await Group.getAll();
    res.json(groups);
});

router.get('/:id', async (req, res) => {
    const group = await Group.getById(req.params.id);
    res.json(group);
});

router.delete('/:id', async (req, res) => {
    await Group.deleteById(req.params.id);
    res.sendStatus(204);
});

router.post('/new', async (req, res) => {
    const { name, description, key } = req.body;
    const group = await Group.create(name, description, key);
    res.status(201).json(group);
});


module.exports = router;