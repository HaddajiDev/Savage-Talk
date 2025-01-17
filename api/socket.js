const messages = require('./models/messages');
const User = require('./models/users');
const Group = require('./models/group');

module.exports = (io) => {
    const users = {};
    io.on("connection", (socket) => {
        console.log("New client connected");

        socket.on('joinRoom', (room) => {
            socket.join(room);
        });

        socket.on('login', function(data){
            console.log('a user ' + data.userId + ' connected');
            users[socket.id] = data.userId;
            io.emit('updateOnlineUsers', users);
        });

        socket.on("disconnect", () => {
            console.log("Client disconnected");
            delete users[socket.id];
            io.emit('updateOnlineUsers', users);
        });

        socket.on('deleteMessage', async ({ id, room }) => {
            await messages.findByIdAndDelete(id);
            io.to(room).emit('Message_deleted', id);
        });   

        socket.on("message", async (data) => {
            try {
                const user = await User.findById(data.userId);
                const newMessage = new messages({
                    body: data.message,
                    userId: data.userId,
                    user: {
                        username: user.username,
                        imageUrl: user.profileImageUrl
                    },
                    room: data.room
                });
                await newMessage.save();

                io.to(data.room).emit("Message_received", newMessage);
            } catch (error) {
                console.error("Error saving message: ", error);
            }
        });

        socket.on("addUserToGroup", async ({ groupId, userId }) => {
            const group = await Group.findById(groupId);
            if (group) {
                const user = await User.findById(userId);
                if (user && !group.members.some(member => member.userId.toString() === userId.toString())) {
                    group.members.push({userId: userId});
                    user.groups.push({groupId: group._id});
                    await user.save();
                    await group.save();                    
                    io.to(group.room).emit("User_added", { groupId, user });
                }
            }
        });
        socket.on('joinServer', async (serverId) => {
            const server = await Group.findById(serverId);
            if (server) {
                socket.join(server.room);
                io.to(server.room).emit('Server_joined', { serverId, room: server.room });
            }
        });

        socket.on("kickUserFromGroup", async ({ groupId, userId }) => {
            const group = await Group.findById(groupId);
            const user = await User.findById(userId);
            if (group) {
                group.members = group.members.filter(member => member.userId.toString() !== userId);
                user.groups = user.groups.filter(group => group.groupId.toString() !== groupId);
                await group.save();
                await user.save();
                io.to(group.room).emit("User_kicked", { groupId, userId });
            }
        });
    });
};
