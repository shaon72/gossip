import * as Dialog from '@radix-ui/react-dialog';
import { useState } from 'react';
import { IoIosCloseCircleOutline, IoIosPersonAdd } from 'react-icons/io';
import useSelectedChannelStore from '../stores/SelectedChannelStore';

const DialogForUser = () => {
  const selectedChannel = useSelectedChannelStore((state) => state.selectedChannel);
  const [userName, setUserName] = useState<string>("");
  const [errorFlag, setErrorFlag] = useState<boolean>(false);

  const handleUsers = () => {
    const url = "http://localhost:8000/addUser?userName=" + userName + "&channelName=" + selectedChannel;
    fetch(url)
      .then((response) => {
        if (!response.ok) {
          setErrorFlag(true);
          return;
        }
      });
  };

  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <button 
          className="text-lg bg-blue-500 hover:bg-blue-600 text-white rounded p-2">
          <IoIosPersonAdd />
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black bg-opacity-50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white p-4 rounded shadow-md w-96">
          <Dialog.Title className="text-black font-semibold mb-4">Add an user</Dialog.Title>

          <fieldset className="flex items-center gap-2">
            <input className="w-full h-[30px] bg-gray-100 text-black outline-none" 
              onChange={(e) => setUserName(e.target.value)} />
          </fieldset>
          <fieldset>
            {errorFlag && <span className="text-red-500 text-xs">User has already been added!</span>}
          </fieldset>
          <fieldset className="flex justify-center mt-2">
            <button className="p-1 rounded bg-blue-500 hover:bg-blue-600"
              onClick={handleUsers}>Add</button>
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
}

export default DialogForUser;