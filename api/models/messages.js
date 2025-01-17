const { body } = require('express-validator');
const mongoose = require('mongoose');

const messageModal = new mongoose.Schema({
	body: {
		type: String,
		required: true
	},
	userId: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'user',
		required: true
	},
	user: {
		username: {type: String},
		imageUrl: {type: String}
	},
	room: {type: Number},
	createdAt: {type: Date, default: Date.now()},
	deletedAt: {
        type: Date,
        default: () => {
            const today = new Date();
            today.setDate(today.getDate() + 3);
            return today;
        }
    }
	
});

module.exports = mongoose.model('message', messageModal);