import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import axios from 'axios';

const link = process.env.REACT_APP_LINK

export const userLogin = createAsyncThunk("user/login", async(user, {rejectWithValue})=>{
	try {
		let response = await axios.post(`${link}/user/login`, user);
		return response.data;
	} catch (error) {
		console.log(error);
		return rejectWithValue(error.response.data)
	}
});

export const currentUser = createAsyncThunk("user/current", async () => {
    try {
        
        const result = await axios.get(`${link}/user/current`, {
            headers: {
                Authorization: localStorage.getItem("token"),
            }
        });
        return result;
    } catch (error) {
        
    }
});



export const GetAllGroups = createAsyncThunk('user/allGroups', async(userId) => {
	try {
		const response = await axios.get(`${link}/user/groups/all`, {
            params: { userId }
        });
		return response.data;
	} catch (error) {
		console.log(error);
	}
});



export const AddGroupUser = createAsyncThunk('user/groupadd', async ({ groupId, userId }) => {
    try {
        const result = await axios.post(`${link}/user/group/adduser`, { groupId, userId });
        return result.data;
    } catch (error) {
        console.log('Error in AddGroupUser thunk:', error);
        throw error;
    }
});

export const LeaveGroup = createAsyncThunk('user/groupleave', async({ groupId, userId }) => {
	try {
        const result = await axios.delete(`${link}/user/group/userOut`, {
            data: { groupId, userId }
        });
        return result.data;
    } catch (error) {
        console.log('Error in KickOutGroup thunk:', error);
        throw error;
    }

});

export const KickOutGroup = createAsyncThunk('user/groupKick', async({ groupId, userId }) => {
    try {
        const result = await axios.delete(`${link}/user/group/kick`, {
            data: { groupId, userId }
        });
        return result.data;
    } catch (error) {
        
    }
});

export const GetAllUserServers = createAsyncThunk('user/allServer', async({userId}) => {
	try {
		const response = await axios.get(`${link}/user/server/all`, {
            params: { userId }
        });
		return response.data;
	} catch (error) {
		console.log(error);
	}
});

export const GetUser = createAsyncThunk('user/one', async ({ id }) => {
    try {
        const response = await axios.get(`${link}/user/one`, {
            params: { id }
        });
        return response.data;
    } catch (error) {
        console.log(error);
    }
});

export const verifyUser = createAsyncThunk("user/verify", async({ token }) => {
	try {
		const response = await axios.post(`${link}/user/verify`, { token });
		return response.data;
	} catch (error) {
		console.log(error);
	}
})


const initialState = {
    user: null,
    status: null,    
    error: null,
    groups: [],
	server: [],
}

export const UserSlice = createSlice({
    name: 'user',
  initialState,
  reducers: {
	logout : (state, action) => {
		state.user = null;
		localStorage.removeItem('token');
	}
  },
  extraReducers: (builder) => {
	builder	
	
	//login
	.addCase(userLogin.pending, (state, action) => {		
		state.status = "pending";
		state.error = null;
	})
	.addCase(userLogin.fulfilled, (state, action) => {
		state.status = "success";
		state.user = action.payload?.user;
		localStorage.setItem("token", action.payload.token);
	})
	.addCase(userLogin.rejected, (state, action) => {
		state.status = "failed";
		state.error = action.payload.error || 'Something went wrong';
	})

	.addCase(currentUser.pending, (state) => {
		state.status = "pending";
	})
	.addCase(currentUser.fulfilled, (state, action) => {
		state.status = "success";		
		state.user = action.payload?.data.user;
	})
	.addCase(currentUser.rejected, (state) => {
		state.status = "failed";
	})

	.addCase(GetAllGroups.pending, (state) => {
		state.status = "pending";
	})
	.addCase(GetAllGroups.fulfilled, (state, action) => {
		state.status = "success";		
		state.groups = action.payload?.groups;
	})
	.addCase(GetAllGroups.rejected, (state) => {
		state.status = "failed";
	})

	.addCase(GetAllUserServers.pending, (state) => {
		state.status = "pending";
	})
	.addCase(GetAllUserServers.fulfilled, (state, action) => {
		state.status = "success";		
		state.server = action.payload?.groups;
	})
	.addCase(GetAllUserServers.rejected, (state) => {
		state.status = "failed";
	})

	.addCase(verifyUser.fulfilled, (state, action) => {
		state.user = action.payload.user;
		localStorage.setItem("token", action.payload.token);
	})
}
})


export const { logout } = UserSlice.actions
export default UserSlice.reducer