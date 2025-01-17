const express = require('express');
const router = express.Router();
const User = require('../models/users');
const Group = require('../models/group');
const bcrypt = require('bcrypt');

var jwt = require('jsonwebtoken');

const {loginRules, validation, UpdateRules} = require('../middleware/validator');

const isAuth = require('../middleware/passport');
const messages = require('../models/messages');

router.post('/login', loginRules(), validation, async (request, result) => {
    const { email, password } = request.body;
    try {
        // Await the result of findOne
        const searchedUser = await User.findOne({ email });
        if (!searchedUser) {
            return result.status(400).send({error: "User not found"});
        }

        // Await the result of bcrypt.compare
        const match = await bcrypt.compare(password, searchedUser.password);

        if (!match) {
            return result.status(400).send({error: "Invalid credentials"});
        }       

		//create token
		const payload = {
			_id: searchedUser._id
		}
		const token = await jwt.sign(payload, process.env.SCTY_KEY, {
			expiresIn: '7d'
		});
        
        result.status(200).send({ user: searchedUser, msg: 'User logged in successfully', token: `bearer ${token}` });
    } catch (error) {
        console.error("Error during login:", error);
        result.status(500).send({error: "Login Failed"});
    }
});

router.get('/current', isAuth(), (request, result) => {
    result.status(200).send({user: request.user});
});



router.get('/groups/all', async (req, res) => {
    try {
        const userId = req.query.userId;
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).send({ error: 'User not found' });
        }

        let groups = [];

        await Promise.all(user.groups.map(async (group) => {
            const g = await Group.findById(group.groupId);

            if (g) {
                const authorPromise = User.findById(g.author);
                const membersPromises = g.members.map(member => User.findById(member.userId));

                const [author, ...members] = await Promise.all([authorPromise, ...membersPromises]);

                if (author) {
                    const memberDetails = members.map(member => ({
                        username: member.username,
                        _id: member._id,
                        profileImageUrl: member.profileImageUrl
                    }));

                    groups.push({
                        author: {
                            username: author.username,
                            profileImageUrl: author.profileImageUrl,
                            _id: author._id
                        },
                        room: g.room,
                        _id: g._id,
                        groupName: g.GroupName,
                        isServere: g.isServer,
                        imageUrl: g.imageUrl,
                        bio: g.bio,
                        members: memberDetails
                    });
                }
            }
        }));
        const normalGroup = groups.filter(group => group.isServere === false);
        res.send({ groups:  normalGroup});
    } catch (error) {
        
    }
});

router.get('/server/all', async (req, res) => {
    try {
        const userId = req.query.userId;
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).send({ error: 'User not found' });
        }

        if (!user.groups || !Array.isArray(user.groups)) {
            return res.status(400).send({ error: 'User has no groups or groups data is invalid' });
        }

        let groups = [];

        await Promise.all(user.groups.map(async (group) => {
            const g = await Group.findById(group.groupId);

            if (g) {
                const authorPromise = User.findById(g.author);
                const membersPromises = g.members.map(member => User.findById(member.userId));

                const [author, ...members] = await Promise.all([authorPromise, ...membersPromises]);

                if (author) {
                    const memberDetails = members.map(member => ({
                        username: member.username,
                        _id: member._id,
                        profileImageUrl: member.profileImageUrl
                    }));

                    groups.push({
                        author: {
                            username: author.username,
                            profileImageUrl: author.profileImageUrl,
                            _id: author._id
                        },
                        room: g.room,
                        _id: g._id,
                        groupName: g.GroupName,
                        isServere: g.isServer,
                        imageUrl: g.imageUrl,
                        bio: g.bio,
                        members: memberDetails
                    });
                }
            }
        }));

        const serverGroup = groups.filter(group => group.isServere);
        res.send({ groups: serverGroup });
    } catch (error) {
        console.error('Error fetching server groups:', error);
        res.status(500).send({ error: 'An error occurred while fetching server groups' });
    }
});





router.delete('/group/userOut', async (req, res) => {
    try {
        const { groupId, userId } = req.body;

        const user = await User.findById(userId);
        const group = await Group.findById(groupId);

        if (!user || !group) {
            return res.status(404).send({ error: 'User or group not found' });
        }

        if (userId === group.author.toString()) {
            user.groups = user.groups.filter((el) => el.groupId.toString() !== groupId.toString());
            group.members = group.members.filter((el) => el.userId.toString() !== userId.toString());

            if (group.members.length > 0) {
                group.author = group.members[0].userId;
                await group.save();
            } else {
                await messages.deleteMany({room: group.room});
                await Group.deleteOne({ _id: groupId });
            }
        } else {
            user.groups = user.groups.filter((el) => el.groupId.toString() !== groupId.toString());
            group.members = group.members.filter((el) => el.userId.toString() !== userId.toString());
            await group.save();
        }

        await user.save();

        res.send({ msg: 'User out' });
    } catch (error) {
        
    }
});


router.delete('/group/kick', async (req, res) => {
    try {
        const { userId, groupId } = req.body;

        const user = await User.findById(userId);
        const group = await Group.findById(groupId);

        if (!user || !group) {
            return res.status(404).send({ error: 'User or group not found' });
        } 

        group.members = group.members.filter((member) => member.userId.toString() !== userId.toString());        
        user.groups = user.groups.filter((g) => g.groupId.toString() !== groupId);

        
        await group.save();
        await user.save();

        res.send({ msg: 'User Kicked' });
    } catch (error) {        
        
    }
});

router.post('/group/adduser', async (req, res) => {
    try {
        const { userId, groupId } = req.body;

        const user = await User.findById(userId);
        const group = await Group.findById(groupId);
        if (!user || !group) {
            return res.status(404).send({ error: 'User or group not found' });
        }

        if (group.members.some(member => member.userId.toString() === userId.toString())) {
            return res.status(400).send({ error: 'User is already in the group' });
        }
        if (user.groups.some(g => g.groupId.toString() === groupId.toString())) {
            return res.status(400).send({ error: 'User is already in the group' });
        }

        user.groups.push({ groupId: group._id });
        group.members.push({ userId: user._id });

        await group.save();
        await user.save();

        
        const responseUser = {
            _id: user._id,
            username: user.username,
            profileImageUrl: user.profileImageUrl
        };

        res.send({ msg: 'User added to the group', user: responseUser });

    } catch (error) {        
        
    }
});


router.get('/one', async(req, res) => {
    try {
        const id = req.query.id;
        const user = await User.findById(id);

        res.send({user: user});
    } catch (error) {
        
    }
});



module.exports = router;