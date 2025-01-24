import React from 'react';
import { useEffect, useRef, useState } from 'react';
import { MdGroups, MdLogout } from 'react-icons/md';
import socket from '../SocketConfig';
import useChannelStore from '../stores/ChannelStore';
import { useAuth0 } from '@auth0/auth0-react';
import DialogForChannel from '../components/DialogForChannel';
import DialogForUser from '../components/DialogForUser';
import ChannelInfoDialog from '../components/ChannelInfoDialog';
import useSelectedChannelStore from '../stores/SelectedChannelStore';

const Home = () => {
  const [outgoingMessage, setOutgoingMessage] = useState<string>("");
  const [incomingMessages, setIncomingMessages] = useState<string[]>([]);
  const [senders, setSenders] = useState<string[]>([]);
  const channels = useChannelStore((state) => state.channels);
  const addChannel = useChannelStore((state) => state.addChannel);
  const reloadChannels = useChannelStore((state) => state.reloadChannels);
  const removeChannel = useChannelStore((state) => state.removeChannel);
  const [selectedChannel, setSelectedChannel] = useState<string>("");
  const globalSelectedChannel = useSelectedChannelStore((state) => state.setSelectedChannel);
  const [openChannelBar, setChannelBar] = useState<boolean>(false);
  const { user, isLoading } = useAuth0();
  const pageLoaded = useRef<boolean>(false);

  useEffect(() => {   
    if(!isLoading && !pageLoaded.current) {
      const url = `http://localhost:8000/loadPage?userName=${user!.name}`;

      fetch(url)
        .then((response) => {
          if (!response.ok) {
            throw new Error("Failed to fetch channels");
          }
          return response.json();
        })
        .then((data) => {
          data.forEach((element: string) => {
            addChannel(element);
          });
        })
        .catch((err) => {
          console.error("Error fetching channels:", err);
        });
      pageLoaded.current = true;
      reloadChannels();
    }
  }, [isLoading]);
  
  useEffect(() => {
    socket.onmessage = (event) => {
      let jsonObj = JSON.parse(event.data);
      if(jsonObj.channel == selectedChannel) {
        setIncomingMessages((prev) => [...prev, jsonObj.msg]);
        setSenders((prev) => [...prev, jsonObj.sender]);
      }
    };
  }, [socket]);

  const sendMessage = () => {
    if(socket && socket.readyState === 1 && outgoingMessage !== "") {
      socket.send(JSON.stringify({
        channelName: selectedChannel,
        userName: user!.name,
        message: outgoingMessage
      }));
      setOutgoingMessage("");
    }
  };

  const handleChannels = (channel: string) => {
    if(selectedChannel !== channel) {
      setSelectedChannel(channel);
      globalSelectedChannel(channel);
      setChannelBar(true);
      setIncomingMessages([]);
      const url = `http://localhost:8000/getChatHistory?channelName=${channel}`;
      fetch(url)
        .then((response) => {
          if (!response.ok) {
            throw new Error("Failed to fetch channels");
          }
          return response.json();
        })
        .then((data) => {
          data?.forEach((element: { message: string; sender: string; }) => {
            setIncomingMessages(prev => [...prev, element.message]);
            setSenders(prev => [...prev, element.sender]);
          });
        });
    }
  };

  const leaveChannel = () => {
    const url = `http://localhost:8000/leaveChannel?channelName=${selectedChannel}&userName=${user!.name}`;
    fetch(url)
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to fetch channels");
        }
        removeChannel(selectedChannel);
      });
  };

  return (
    <div className="flex">
      <div className="flex flex-col w-1/4 rounded bg-gray-800">     
        <div 
          title={user?.name}
          className="flex items-center justify-center mt-3 ml-5 rounded-full w-8 h-8 bg-blue-500 text-white font-bold cursor-pointer">
          {user?.name?.charAt(0).toUpperCase()}
        </div> 
        <div className="flex m-5 items-center justify-between">
          <div className="text-white text-xl font-semibold">My channels</div>
          <DialogForChannel />
        </div>

        {channels && channels.map((channel, index) => (
          <div key={index}
            className="flex items-center p-4 gap-2 bg-gray-200 text-black cursor-pointer"
            onClick={() => handleChannels(channel)}>
            <MdGroups className="w-6 h-6" />
            {channel}
          </div>
        ))}

      </div>
      <div className="flex flex-col w-full items-center h-screen bg-gray-100">
        {openChannelBar && 
          <div className="flex items-center justify-between bg-gray-800 w-full py-2 px-4">
            <div className="text-left text-white text-lg font-semibold">
              {selectedChannel}
            </div>
            <div className="flex flex-row-reverse gap-2">
              <button
                onClick={() => leaveChannel()}
                className="text-lg bg-blue-500 hover:bg-blue-600 text-white rounded p-2"
              >
                <MdLogout />
              </button>
              <ChannelInfoDialog />
              <DialogForUser />
              
            </div>
          </div>
        }
        <div className="flex flex-col flex-1 w-full">
          <div id="incomingMessages"
            className="flex-1 mb-4 bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 overflow-y-auto"
          >
            {incomingMessages.map((msg, index) => (
              <div key={index} className="flex items-center ml-1 mt-1 mb-2 gap-1">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-800 text-white font-semibold group"
                  >{senders[index].charAt(0).toUpperCase()}                 
                </div> 
                <div className="bg-gray-300 text-black p-2 rounded"
                >{msg}</div>
              </div>            
            ))}
          </div>
          <div className="flex items-center gap-2 mb-4 ml-4 mr-4">
            <textarea
              value={outgoingMessage}
              onChange={(e) => setOutgoingMessage(e.target.value)}
              className="flex-1 h-10 p-1 bg-white text-black rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            ></textarea>

            <button
              onClick={sendMessage}
              className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-300"
            >
              Send
            </button>
          </div>
          
        </div>
      </div>
    </div>
    
  )
}

export default Home;