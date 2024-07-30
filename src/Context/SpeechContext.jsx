import React, { createContext, useState, useContext } from 'react';

const SpeechContext = createContext();

export const SpeechProvider = ({ children }) => {
  const [message, setMessage] = useState("");

  return (
    <SpeechContext.Provider value={{ message, setMessage }}>
      {children}
    </SpeechContext.Provider>
  );
};

export const useSpeech = () => useContext(SpeechContext);
