const express = require('express');

const router = express.Router();

const messages = require('../models/messages');
const Group = require('../models/group');
const User = require('../models/users');

router.post('/', async (req, res) => {
    try {
        const { users, author } = req.body;
        const members = users.map(user => ({ userId: user }));
        console.log("members", members);
        const group = new Group({
            members: members,
            author: author,
        });
        
        const newGroup = await group.save();

        let groupName = "";        
        for (let user of users) {
            try {
                const u = await User.findById(user);
                if (u) {
                    groupName += u.username + ",";
                    u.groups.push({ groupId: newGroup._id });
                    await u.save();
                }
            } catch (error) {
                
            }
        }

        newGroup.GroupName = groupName.slice(0, -1);
        await newGroup.save();

        res.send({ msg: 'group created', group: newGroup });

    } catch (error) {
        res.status(500).send({ error: error.message });
    }
});


router.post('/server', async (req, res) => {
    try {
        const { users, author, imageUrl, serverName, bio } = req.body;

        if (!users || !author || !imageUrl || !serverName) {
            return res.status(400).send({ error: 'All fields are required' });
        }

        const user = await User.findById(author);

        const members = users.map(user => ({ userId: user }));
        const server = new Group({
            members: members,
            author: author,
            imageUrl: imageUrl,
            GroupName: serverName,
            isServer: true,
            bio: bio
        });

        user.groups.push({ groupId: server._id });
        await user.save();

        const newServer = await server.save();
        res.send({ msg: "Server created", server: newServer });
    } catch (error) {
        console.error('Error creating server:', error);
        res.status(500).send({ error: error.message });
    }
});



router.patch('/', async(req, res) => {
    try {
        const {groupName, imageUrl, id, bio} = req.body;
        const group = await Group.findByIdAndUpdate(id, {$set: {GroupName: groupName, imageUrl: imageUrl, bio: bio}}, {new: true});
        res.send({group: group});

    } catch (error) {
        res.send({error: error});
    }
});

router.get('/server', async(req, res) => {
    try {
        const servers = await Group.find({isServer: true});
        res.send({ servers });
    } catch (error) {
        
    }
});


router.get('/server/one', async(req, res) => {
    try {
        const serverId = req.query.serverId;
        const server = await Group.findById(serverId);

        let serverWithUser = [];

        await Promise.all(server.members.map(async(member) => {
            const user = await User.findById(member.userId);
            serverWithUser.push({
                username: user.username,
                profileImageUrl: user.profileImageUrl,
                userId: user._id,
            });
        }));
        
        const filteredServerWithUser = serverWithUser.filter(member => member.userId !== "");

        const serverResponse = {
            ...server._doc,
            members: filteredServerWithUser
        };
        
        res.send({server: serverResponse});
        
    } catch (error) {
        
    }
});


router.delete('/server/delete', async(req, res) => {
    try {
        const { serverId } = req.body;
        const server = await Group.findById(serverId);
        await messages.deleteMany({room: server.room});

        Promise.all(server.members.map(async(member) => {
            const user = await User.findById(member.userId);
            user.groups = user.groups.filter((id) => id.groupId.toString() !== server._id.toString());
            await user.save();
        }));

        await Group.deleteOne({_id: serverId});

        res.send({msg: "deleted"});
        
    } catch (error) {
        
    }
})


module.exports = router;