import { configureStore, createSlice, type PayloadAction } from '@reduxjs/toolkit'
import { type TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux'
import matrixSlice from './store/matrixSlice'

// Define the state interface
interface SidebarState {
    doeName: string
    project: string
    block: string
    netVer: string
    revision: string
    ecoNum: string
    columns: Array<{
        id: string
        header: string
        meta: {
            project: string
            block: string
            netVer: string
            revision: string
            ecoNum: string
        }
    }>
}

// Initial state
const initialState: SidebarState = {
    doeName: '',
    project: '',
    block: '',
    netVer: '',
    revision: '',
    ecoNum: '',
    columns: []
}

// Create the slice
const sidebarSlice = createSlice({
    name: 'sidebar',
    initialState,
    reducers: {
        setDoeName: (state, action: PayloadAction<string>) => {
            state.doeName = action.payload
        },
        setProject: (state, action: PayloadAction<string>) => {
            state.project = action.payload
        },
        setBlock: (state, action: PayloadAction<string>) => {
            state.block = action.payload
        },
        setNetVer: (state, action: PayloadAction<string>) => {
            state.netVer = action.payload
        },
        setRevision: (state, action: PayloadAction<string>) => {
            state.revision = action.payload
        },
        setEcoNum: (state, action: PayloadAction<string>) => {
            state.ecoNum = action.payload
        },
        addColumn: (state) => {
            const { doeName, project, block, netVer, revision, ecoNum } = state
            if (!doeName) return
            state.columns.push({
                id: doeName.toLowerCase().replace(/\s+/g, '_'),
                header: doeName,
                meta: { project, block, netVer, revision, ecoNum }
            })
            // Reset input after adding
            state.doeName = ''
        }
    },
})

// Export actions
export const { setDoeName, setProject, setBlock, setNetVer, setRevision, setEcoNum, addColumn } =
    sidebarSlice.actions

// Configure the store
export const store = configureStore({
    reducer: {
        sidebar: sidebarSlice.reducer,
        matrix: matrixSlice,
    },
})

// Export types
export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

// Export hooks
export const useAppDispatch: () => AppDispatch = useDispatch
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector
