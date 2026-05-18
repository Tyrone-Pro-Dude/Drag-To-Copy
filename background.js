chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === "FETCH_IMAGE") {
    fetch(request.url)
      .then(response => {
        if (!response.ok) throw new Error('Network response was not ok');
        return response.blob();
      })
      .then(blob => {
        const reader = new FileReader();
        reader.onloadend = () => {
          sendResponse({ dataUrl: reader.result, type: blob.type });
        };
        reader.readAsDataURL(blob);
      })
      .catch(error => {
        console.error('Background Fetch Error:', error);
        sendResponse({ error: error.message });
      });
    return true; // Keep channel open
  }
});