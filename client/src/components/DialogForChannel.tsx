import * as Dialog from '@radix-ui/react-dialog';
import React, { useState } from 'react';
import { IoIosCloseCircleOutline, IoMdPersonAdd } from 'react-icons/io';
import { useAuth0 } from '@auth0/auth0-react';
import useChannelStore from '../stores/ChannelStore';

const DialogForChannel = () => {
  const [ channelName, setChannelName ] = useState<string>("");
  const { user } = useAuth0();
  const [errorFlag, setErrorFlag] = useState<boolean>(false);
  const addChannelToStore = useChannelStore((state) => state.addChannel);

  const addChannel = () => {
    const url = `http://localhost:8000/addChannel?channelName=${channelName}&userName=${user!.name}`;
    fetch(url)
      .then((response) => {
        if(!response.ok) {
          setErrorFlag(true);
          throw new Error("Failed to add channel");
        }
        addChannelToStore(channelName);
      });
  }
  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <button 
          className="text-lg bg-blue-500 hover:bg-blue-600 text-white rounded p-2">
          <IoMdPersonAdd />
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black bg-opacity-50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white p-4 rounded shadow-md w-96">
          <Dialog.Title className="text-black font-semibold mb-4">Add a channel</Dialog.Title>

          <fieldset className="flex items-center gap-2">
            <input className="w-full h-[30px] bg-gray-100 text-black outline-none" 
              id="channelName" onChange={(e) => setChannelName(e.target.value)} />
          </fieldset>
          <fieldset>
            {errorFlag && <span className="text-red-500 text-xs">Channel already exists!</span>}
          </fieldset>
          <fieldset className="flex justify-center mt-2">
            <button className="p-1 rounded bg-blue-500 hover:bg-blue-600"
              onClick={addChannel}>Add</button>
          </fieldset>

          <Dialog.Close asChild>
            <button className="absolute right-2 top-2 text-xl text-black">
              <IoIosCloseCircleOutline />
            </button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
};

export default DialogForChannel;