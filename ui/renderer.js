const input = document.getElementById('command-input');
const badge = document.getElementById('action-badge');
const badgeText = document.getElementById('badge-text');
const barContainer = document.getElementById('bar-container');
const resultStrip = document.getElementById('result-strip');
const resultText = document.getElementById('result-text');

let isBusy = false;

function resetState() {
  resultStrip.className = 'result-strip hidden';
  window.ghostAPI?.setWindowHeight?.(64);
  input.value = '';
  input.disabled = false;
  barContainer.classList.remove('working');
  badge.classList.remove('active');
  badgeText.textContent = '⏎';
  isBusy = false;
  setTimeout(() => input.focus(), 50);
}

// When shown via hotkey or second-instance trigger
if (window.ghostAPI?.onResetFocus) {
  window.ghostAPI.onResetFocus(() => {
    resetState();
  });
}

// Save position whenever the user finishes dragging and releases the mouse
window.addEventListener('mouseup', () => {
  window.ghostAPI?.savePosition?.();
});

input.addEventListener('input', () => {
  const query = input.value.trim();
  if (query.length > 0) {
    badge.classList.add('active');
  } else {
    badge.classList.remove('active');
  }
});

async function submitTask() {
  const prompt = input.value.trim();
  if (!prompt || isBusy) return;

  isBusy = true;
  input.disabled = true;
  barContainer.classList.add('working');
  badgeText.textContent = '...';

  try {
    const result = await window.ghostAPI.runPrompt(prompt);
    const isError = result.toLowerCase().startsWith('error');

    // Show result strip
    resultText.textContent = (isError ? '✗ ' : '✓ ') + result;
    resultStrip.className = isError ? 'result-strip error' : 'result-strip';
    window.ghostAPI?.setWindowHeight?.(112);

    badgeText.textContent = isError ? '✗' : '✓';

    setTimeout(() => {
      window.ghostAPI?.closeWindow?.();
      resetState();
    }, 2400);
  } catch (err) {
    resultText.textContent = `✗ Error: ${err.message}`;
    resultStrip.className = 'result-strip error';
    window.ghostAPI?.setWindowHeight?.(112);
    badgeText.textContent = '✗';
    isBusy = false;
    input.disabled = false;
  }
}

window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    window.ghostAPI?.closeWindow?.();
    resetState();
    return;
  }

  if (e.key === 'Enter') {
    e.preventDefault();
    submitTask();
  }
});

input.focus();
