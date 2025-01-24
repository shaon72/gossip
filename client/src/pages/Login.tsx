import { useAuth0 } from '@auth0/auth0-react';
import React from 'react';

const Login = () => {
  const { loginWithRedirect } = useAuth0();
  return (
    <div className="flex h-screen">
      <div className="w-1/2 bg-blue-500 text-white flex flex-col justify-center items-center p-10">
        <h1 className="text-4xl font-bold mb-6">Welcome to Gossip!</h1>
        <p className="text-lg">
          Gossip is a simple messaging platform, designed to keep you connected
          with your friends, family, and colleagues in a seamless and secure way.
        </p>
        
      </div>
      <div className="w-1/2 flex flex-col justify-center items-center p-10 bg-gray-100">
        <div className="flex flex-col items-center w-full max-w-md">
          <p className="font-semibold text-center text-black mb-6">
            Log in to start chatting with your favourite people.
          </p>
          <button
            onClick={() => loginWithRedirect()}
            className="bg-blue-500 text-white px-6 py-3 rounded-lg shadow hover:bg-blue-600 transition"
          >
            Log In
          </button>
        </div>
      </div>
    </div>
  )
}

export default Login;