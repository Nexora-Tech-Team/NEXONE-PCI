import { createSlice, PayloadAction } from '@reduxjs/toolkit'

interface UIState {
  sidebarOpen: boolean
  activeModal: string | null
}

const initialState: UIState = {
  sidebarOpen: true,
  activeModal: null,
}

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleSidebar(state) { state.sidebarOpen = !state.sidebarOpen },
    setSidebar(state, action: PayloadAction<boolean>) { state.sidebarOpen = action.payload },
    openModal(state, action: PayloadAction<string>) { state.activeModal = action.payload },
    closeModal(state) { state.activeModal = null },
  },
})

export const { toggleSidebar, setSidebar, openModal, closeModal } = uiSlice.actions
export default uiSlice.reducer
