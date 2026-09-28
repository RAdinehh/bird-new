import { create } from 'zustand';

interface UIState {
  menuOpen: boolean;
  helpOpen: boolean;
  shortcutsOpen: boolean;
  openMenu: () => void;
  closeMenu: () => void;
  openHelp: () => void;
  closeHelp: () => void;
  openShortcuts: () => void;
  closeShortcuts: () => void;
}

export const useUI = create<UIState>((set) => ({
  menuOpen: false,
  helpOpen: false,
  shortcutsOpen: false,
  openMenu: () => set({ menuOpen: true }),
  closeMenu: () => set({ menuOpen: false }),
  openHelp: () => set({ helpOpen: true }),
  closeHelp: () => set({ helpOpen: false }),
  openShortcuts: () => set({ shortcutsOpen: true }),
  closeShortcuts: () => set({ shortcutsOpen: false })
}));
