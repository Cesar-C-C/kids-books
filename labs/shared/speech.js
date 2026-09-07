/* Shared browser speech controls for all 3D labs. */
window.LabSpeech = {
  create(button, status) {
    let speechId = 0;
  function stopSpeech() {
    speechId++;
    if ('speechSynthesis' in window) speechSynthesis.cancel();
    button.querySelector('span').textContent = '听英文 · Listen';
    status.textContent = '';
  }
  function say(text, main = false) {
    stopSpeech();
    if (!('speechSynthesis' in window)) {
      status.textContent = '此浏览器不支持朗读，可以一起读上面的英文。';
      return;
    }
    const id = speechId;
    const utterance = new SpeechSynthesisUtterance(text);
    const voices = speechSynthesis.getVoices();
    const english = voices.filter(v => /^en[-_]/i.test(v.lang));
    utterance.voice = english.find(v => v.localService && /^en-US$/i.test(v.lang)) || english.find(v => /^en-US$/i.test(v.lang)) || english[0] || null;
    utterance.lang = 'en-US';
    utterance.rate = 0.82;
    utterance.pitch = 1.05;
    utterance.onstart = () => { if (id === speechId && main) button.querySelector('span').textContent = '停止朗读 · Stop'; };
    utterance.onend = () => { if (id === speechId) button.querySelector('span').textContent = '再听一次 · Listen again'; };
    utterance.onerror = e => {
      if (id !== speechId || e.error === 'interrupted' || e.error === 'canceled') return;
      button.querySelector('span').textContent = '重试朗读 · Try again';
      status.textContent = '英文语音暂不可用，请检查设备的英语语音设置。';
    };
    speechSynthesis.speak(utterance);
  }

    return {stop: stopSpeech, say};
  }
};
