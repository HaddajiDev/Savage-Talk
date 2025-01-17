const { body } = require('express-validator');
const mongoose = require('mongoose');

const groupModal = new mongoose.Schema({
	members: [
        {
            userId: {type: mongoose.Schema.Types.ObjectId, ref: 'user'}
        }
    ],
    author: {type: mongoose.Schema.Types.ObjectId, ref: 'user'},
    room: {type: Number, unique: true},
    isServer: {type: Boolean, default: false},
    imageUrl: {type: String, default: ""},
    GroupName: {type: String},
    bio: {type: String, default: ""},
    createdAt: {type: Date, default: Date.now()}	
});

groupModal.pre('save', async function (next) {
    const group = this;

    if (group.isNew) {
        try {            
            const maxRoomResult = await mongoose.model('group').aggregate([
                { $group: { _id: null, maxRoom: { $max: '$room' } } }
            ]);            
            let nextRoomNumber = 1; 
            if (maxRoomResult.length > 0 && maxRoomResult[0].maxRoom) {
                nextRoomNumber = maxRoomResult[0].maxRoom + 2;
            }
            group.room = nextRoomNumber;

        } catch (error) {
            return next(error);
        }
    }

    next();
});


module.exports = mongoose.model('group', groupModal);