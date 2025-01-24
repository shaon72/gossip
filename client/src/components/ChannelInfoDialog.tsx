import * as Dialog from '@radix-ui/react-dialog';
import React, { useState } from 'react';
import { IoIosCloseCircleOutline, IoMdInformationCircleOutline } from 'react-icons/io';
import useSelectedChannelStore from '../stores/SelectedChannelStore';

const ChannelInfoDialog = () => {
  const selectedChannel = useSelectedChannelStore((state) => state.selectedChannel);
  const [userList, setUserList] = useState<string[]>([]);
  
  const fetchUserList = () => {
    const url = `http://localhost:8000/getUsersInChannel?channelName=${selectedChannel}`;
    fetch(url)
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to fetch channels");
        }
        return response.json();
      })
      .then((data) => {
        setUserList(data);
      })
      .catch((err) => {
        console.error(err);
      })
  };
  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <button 
          onClick={() => fetchUserList()}
          className="text-lg bg-blue-500 hover:bg-blue-600 text-white rounded p-2">
          <IoMdInformationCircleOutline />
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black bg-opacity-50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white p-4 rounded shadow-md w-[400px]">
          <Dialog.Title className="text-lg text-black font-semibold mb-4">Channel Members</Dialog.Title>

          {userList && userList.map((user, index) => (
            <div key={index} className="text-black">
              {user}
            </div>
          ))}

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

export default ChannelInfoDialog;