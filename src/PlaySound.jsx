export const playSound = (message) => {
    const speechSynthesis = window.speechSynthesis;
    const utterance = new SpeechSynthesisUtterance(message);
    
    utterance.onstart = () => {
        console.log('Speech started');
    };
    
    utterance.onend = () => {
        console.log('Speech ended');
    };
    
    utterance.onerror = (event) => {
        console.error('Speech error:', event.error);
    };

    try {
        speechSynthesis.speak(utterance);
        console.log('Speech synthesis initiated');
    } catch (error) {
        console.error('Error initiating speech synthesis:', error);
    }
};