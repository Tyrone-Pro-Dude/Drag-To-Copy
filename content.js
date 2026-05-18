// 1. Create and inject the Blue Ghost Box UI
const fluxZone = document.createElement('div');
fluxZone.id = 'flux-copy-zone';
fluxZone.innerText = "DROP TO COPY";

// Style it directly in JS since you don't have style.css right now
Object.assign(fluxZone.style, {
  position: 'fixed',
  top: '10px',
  right: '10px',
  width: '150px',
  height: '150px',
  background: 'rgba(0, 123, 255, 0.15)',
  border: '2px dashed #007bff',
  borderRadius: '12px',
  display: 'none', // Hidden by default
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: '2147483647',
  color: '#007bff',
  fontFamily: 'system-ui, -apple-system, sans-serif',
  fontWeight: 'bold',
  fontSize: '14px',
  pointerEvents: 'auto',
  backdropFilter: 'blur(4px)',
  transition: 'background 0.2s ease'
});
document.body.appendChild(fluxZone);

// 2. Track drag positions across the screen to reveal the box
document.addEventListener('dragover', (e) => {
  e.preventDefault();
  // If mouse is within 180px of the top-right corner, show the box
  const inCorner = (window.innerWidth - e.clientX) < 180 && e.clientY < 180;
  fluxZone.style.display = inCorner ? 'flex' : 'none';
});

// Visual feedback when hovering exactly inside the box
fluxZone.addEventListener('dragenter', (e) => {
  e.preventDefault();
  e.stopPropagation(); // Stops parent container handling
  fluxZone.style.background = 'rgba(0, 123, 255, 0.3)';
});

fluxZone.addEventListener('dragover', (e) => {
  e.preventDefault();
  e.stopPropagation(); // CRUCIAL: Blocks native browser drop-hijacking mechanics
  e.dataTransfer.dropEffect = 'copy';
});

fluxZone.addEventListener('dragleave', (e) => {
  e.preventDefault();
  e.stopPropagation();
  fluxZone.style.background = 'rgba(0, 123, 255, 0.15)';
});

document.addEventListener('dragend', () => {
  fluxZone.style.display = 'none';
});

// 3. Handle the Drop and Copy Logic
fluxZone.addEventListener('drop', async (e) => {
  e.preventDefault();
  e.stopPropagation(); // CRUCIAL: Stops search engines from forcibly redirecting the page!
  
  fluxZone.style.background = 'rgba(0, 123, 255, 0.15)';
  fluxZone.innerText = "Processing...";

  // Extract image URL from the drag event data
  const htmlData = e.dataTransfer.getData('text/html');
  const match = htmlData.match(/src="([^"]+)"/);
  const imageUrl = match ? match[1] : e.dataTransfer.getData('text/plain');

  if (imageUrl) {
    chrome.runtime.sendMessage({ type: "FETCH_IMAGE", url: imageUrl }, async (response) => {
      if (response && response.dataUrl) {
        try {
          // Create a ghost image to load the dataUrl data safely
          const img = new Image();
          img.src = response.dataUrl;
          
          img.onload = async () => {
            try {
              // Create a hidden Canvas to transcode the image to PNG data
              const canvas = document.createElement('canvas');
              canvas.width = img.width;
              canvas.height = img.height;
              const ctx = canvas.getContext('2d');
              ctx.drawImage(img, 0, 0);

              // Convert Canvas to Blob (PNG format) to satisfy browser clipboard API
              canvas.toBlob(async (blob) => {
                try {
                  const data = [new ClipboardItem({ "image/png": blob })];
                  await navigator.clipboard.write(data);
                  
                  fluxZone.innerText = "Copied PNG! ✅";
                  setTimeout(() => { fluxZone.style.display = 'none'; fluxZone.innerText = "DROP TO COPY"; }, 1500);
                } catch (err) {
                  console.error("Clipboard Write Error:", err);
                  fluxZone.innerText = "Final Block ❌";
                  setTimeout(() => { fluxZone.style.display = 'none'; fluxZone.innerText = "DROP TO COPY"; }, 1500);
                }
              }, 'image/png');
            } catch (err) {
              fluxZone.innerText = "Canvas Error ❌";
              setTimeout(() => { fluxZone.style.display = 'none'; fluxZone.innerText = "DROP TO COPY"; }, 1500);
            }
          };
        } catch (err) {
          fluxZone.innerText = "Load Error ❌";
          setTimeout(() => { fluxZone.style.display = 'none'; fluxZone.innerText = "DROP TO COPY"; }, 1500);
        }
      } else {
        fluxZone.innerText = "Fetch Error ❌";
        setTimeout(() => { fluxZone.style.display = 'none'; fluxZone.innerText = "DROP TO COPY"; }, 1500);
      }
    });
  } else {
    fluxZone.innerText = "No URL found ❌";
    setTimeout(() => { fluxZone.style.display = 'none'; fluxZone.innerText = "DROP TO COPY"; }, 1500);
  }
});