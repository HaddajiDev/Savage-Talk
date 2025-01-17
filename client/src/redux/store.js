import { configureStore } from '@reduxjs/toolkit';
import UserSlice from './UserSlice';
import MsgSlice from './MsgSlice';
import GroupSlice from './GroupSlice';

export const store = configureStore({
    reducer: {
        user: UserSlice,
        msg: MsgSlice,
        group: GroupSlice
    },
  })