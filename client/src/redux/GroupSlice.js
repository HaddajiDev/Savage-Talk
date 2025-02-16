import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import axios from 'axios';

const link = process.env.REACT_APP_LINK

export const createGroup = createAsyncThunk('group/CreateGroup', async ({ users, author }) => {
    try {
        const result = await axios.post(`${link}/group/`, {
            users, author
        });
        return result.data;
    } catch (error) {
        console.log(error);
    }
});

export const createServer = createAsyncThunk('group/createServer', async ({ users, author, imageUrl, serverName, bio }) => {
    try {
        const result = await axios.post(`${link}/group/server/`, {
            users, author, imageUrl, serverName, bio
        });
        return result.data;
    } catch (error) {
        console.log(error);
    }
});

export const UpdateGroup = createAsyncThunk('group/update', async ({groupName, imageUrl, id, bio}) => {
    try {
        const result = await axios.patch(`${link}/group/`, {
            groupName, imageUrl, id, bio
        });
        return result.data;
    } catch (error) {
        console.log(error);
    }
});

export const GetAllServers = createAsyncThunk('group/servers', async() => {
    try {
        const result = await axios.get(`${link}/group/server`);
        return result.data;
    } catch (error) {
        
    }
});

export const GetServerOne = createAsyncThunk('server/one', async({ serverId }) => {
    try {
		const response = await axios.get(`${link}/group/server/one`, {
            params: { serverId }
        });
		return response.data;
	} catch (error) {
		console.log(error);
	}
})

export const DeleteServer = createAsyncThunk('server/delete', async({ serverId }) => {
    try {
        const result = await axios.delete(`${link}/group/server/delete`,{
            data: { serverId }
        } );
        return result.data;
    } catch (error) {
        
    }
})

const initialState = {
    status: null,
    error: null,
    servers: [],
    server: null
};

export const GroupSlice = createSlice({
    name: 'group',
    initialState,
    reducers: {
        addMessage: (state, action) => {
            
        },
    },
    extraReducers: (builder) => {
        builder
        .addCase(createGroup.pending, (state) => {
            state.status = "pending";
        })
        .addCase(createGroup.fulfilled, (state, action) => {
            state.status = "success";
        })
        .addCase(createGroup.rejected, (state) => {
            state.status = "failed";
        })

        .addCase(GetAllServers.pending, (state) => {
            state.status = "pending";
        })
        .addCase(GetAllServers.fulfilled, (state, action) => {
            state.status = "success";
            state.servers = action.payload.servers;
        })
        .addCase(GetAllServers.rejected, (state) => {
            state.status = "failed";
        })


        .addCase(GetServerOne.pending, (state) => {
            state.status = "pending";
        })
        .addCase(GetServerOne.fulfilled, (state, action) => {
            state.status = "success";
            state.server = action.payload.server;
        })
        .addCase(GetServerOne.rejected, (state) => {
            state.status = "failed";
        })
    },
});

export const {  } = GroupSlice.actions;
export default GroupSlice.reducer;
