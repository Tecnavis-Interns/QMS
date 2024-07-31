import React, { useContext, useEffect, useState } from 'react';
import { SpeechContext } from './Context/SpeechContext';

const SpeechHandler = () => {
  const { message } = useContext(SpeechContext);
  const [speakMessage, setSpeakMessage] = useState('');

  useEffect(() => {
    if (message) {
      setSpeakMessage(message);  // Set the message that should be spoken
    }
  }, [message]);

  useEffect(() => {
    if (speakMessage) {
      // Cancel any ongoing speech
      if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
      }

      // Create a new utterance and speak it
      const utterance = new SpeechSynthesisUtterance(speakMessage);
      utterance.onend = () => {
        setSpeakMessage('');  // Clear the speakMessage state after speaking
      };
      window.speechSynthesis.speak(utterance);
    }
  }, [speakMessage]);

  return null;
};

export default SpeechHandler;
