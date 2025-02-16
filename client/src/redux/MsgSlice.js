import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import axios from 'axios';


const link = process.env.REACT_APP_LINK

export const SendMasg = createAsyncThunk('msg/send', async ({ userId, body, room }) => {
    try {
        const response = await axios.post(`${link}/msg/`, { userId, body, room });
        return response.data;
    } catch (error) {
        console.error(error);
    }
});

export const GetAllMsgs = createAsyncThunk('msg/all', async ({ room }) => {
    try {
        const response = await axios.get(`${link}/msg/`, {
            params: { room }
        });
        return response.data;
    } catch (error) {
        console.error(error);
    }
});

export const DeleteMsg = createAsyncThunk('msg/delete', async({id}) => {
    try {
        const response = await axios.delete(`${link}/msg/`, {id});
        return response.data;
    } catch (error) {
        
    }
})

const initialState = {
    msgs: [],
    status: null,
    error: null,
};

export const MsgSlice = createSlice({
    name: 'msg',
    initialState,
    reducers: {
        addMessage: (state, action) => {
            state.msgs.push(action.payload);
        },
        deleteMessage: (state, action) => {
            state.msgs = state.msgs.filter((msg) => msg._id !== action.payload);
        }

    },
    extraReducers: (builder) => {
        builder
            .addCase(SendMasg.pending, (state) => {
                state.status = 'pending';
            })
            .addCase(SendMasg.fulfilled, (state, action) => {
                state.status = 'success';
                state.msgs.push(action.payload.message);
            })
            .addCase(SendMasg.rejected, (state) => {
                state.status = 'failed';
            })
            .addCase(GetAllMsgs.pending, (state) => {
                state.status = 'pending';
            })
            .addCase(GetAllMsgs.fulfilled, (state, action) => {
                state.status = 'success';
                state.msgs = action.payload.msgs;
            })
            .addCase(GetAllMsgs.rejected, (state) => {
                state.status = 'failed';
            })
            .addCase(DeleteMsg.fulfilled, (state, action) => {
                state.msgs = state.msgs.filter((msg) => msg._id !== action.payload.id);
            });
    },
});

export const { addMessage, deleteMessage } = MsgSlice.actions;
export default MsgSlice.reducer;
