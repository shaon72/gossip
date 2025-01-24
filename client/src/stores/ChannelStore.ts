import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface ChannelStore {
  channels: string[];
  addChannel: (channel: string) => void;
  removeChannel: (channel: string) => void;
  reloadChannels: () => void;
}
const useChannelStore = create<ChannelStore>()(
  persist((set) => ({
    channels: [],
    addChannel: (channel) => set((state) => ({ 
      channels: [...state.channels, channel],
    })),
    removeChannel: (channel) => set((state) => ({
      channels: state.channels.filter((ch) => ch !== channel),
    })),
    reloadChannels: () => set({
      channels: []
    })
  }),
  {
    name: "channel-data",
    storage: createJSONStorage(() => sessionStorage)
  })
);

export default useChannelStore;