import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface selectedChannelStore {
  selectedChannel: string;
  setSelectedChannel: (channel: string) => void;
}
const useSelectedChannelStore = create<selectedChannelStore>()(
  persist((set) => ({
    selectedChannel: "",
    setSelectedChannel: (channel) => 
      set({
        selectedChannel: channel
      })
  }),
  {
    name: "selected-channel",
    storage: createJSONStorage(() => sessionStorage)
  }));

export default useSelectedChannelStore;