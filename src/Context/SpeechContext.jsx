import React, { createContext, useState } from 'react';

export const SpeechContext = createContext();

export const SpeechProvider = ({ children }) => {
  const [textToSpeak, setTextToSpeak] = useState('');

  return (
    <SpeechContext.Provider value={{ textToSpeak, setTextToSpeak }}>
      {children}
    </SpeechContext.Provider>
  );
}