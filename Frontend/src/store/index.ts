import { configureStore } from '@reduxjs/toolkit'
import { useDispatch, useSelector } from 'react-redux'
import authReducer from '../features/auth/authSlice'
import notesReducer from '../features/notes/notesSlice'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    notes: notesReducer,
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

export const useAppDispatch: () => AppDispatch = useDispatch
export const useAppSelector = useSelector.withTypes<RootState>()

