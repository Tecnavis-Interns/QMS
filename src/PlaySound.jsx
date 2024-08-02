export const playSound = (message) => {
    return new Promise((resolve, reject) => {
        const speechSynthesis = window.speechSynthesis;
        const utterance = new SpeechSynthesisUtterance(message);
        
        utterance.onstart = () => {
            console.log('Speech started');
        };
        
        utterance.onend = () => {
            console.log('Speech ended');
            resolve();
        };
        
        utterance.onerror = (event) => {
            console.error('Speech error:', event.error);
            reject(event.error);
        };

        try {
            speechSynthesis.speak(utterance);
            console.log('Speech synthesis initiated');
        } catch (error) {
            console.error('Error initiating speech synthesis:', error);
            reject(error);
        }
    });
};