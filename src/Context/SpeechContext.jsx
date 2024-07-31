import React, { createContext, useState, useContext } from 'react';

export const SpeechContext = createContext();

export const SpeechProvider = ({ children }) => {
  const [message, setMessage] = useState("");

  console.log("SpeechProvider rendering, message:", message);

  const value = {
    message,
    setMessage: (newMessage) => {
      console.log("SpeechProvider: setMessage called with:", newMessage);
      setMessage(newMessage);
    }
  };

  return (
    <SpeechContext.Provider value={value}>
      {children}
    </SpeechContext.Provider>
  );
};

export const useSpeech = () => {
  const context = useContext(SpeechContext);
  if (context === undefined) {
    throw new Error('useSpeech must be used within a SpeechProvider');
  }
  return context;
};