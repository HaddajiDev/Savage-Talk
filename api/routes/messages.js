const express = require('express');

const router = express.Router();

const messages = require('../models/messages');
const User = require('../models/users');


router.post("/", async(req, res) => {
	try {
		const user = await User.findById(req.body.userId);
		const Message = new messages({			
			body: req.body.body,
			userId: req.body.userId,
			user:{
				username: user.username,
				imageUrl: user.profileImageUrl
			},
			room: req.body.room
		})		
		const newMessage = await Message.save();

		res.send({message: newMessage});
	} catch (error) {
		
	}
});

router.get('/', async (req, res) => {
    try {
        const room = req.query.room;
		const now = new Date();
        await messages.deleteMany({ deletedAt: { $lte: now } });

        const msgs = await messages.find({ room: room });
		
        res.send({ msgs: msgs });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

router.delete('/', async(req, res) => {
	try {
		const { id } = req.body;
		const message = await messages.findByIdAndDelete(id);
		res.send({msg: 'message deleted'});
	} catch (error) {
		
	}
});


module.exports = router;