const input = document.getElementById('command-input');
const actionNewTask = document.getElementById('action-new-task');
const actionTitle = document.getElementById('action-title');
const actionHint = document.getElementById('action-hint');
const statusText = document.getElementById('status-text');
const allSelectables = [actionNewTask, ...document.querySelectorAll('.nav-item')];

let selectedIndex = 0;
let isBusy = false;

// Update UI selection highlight
function updateSelection(index) {
  if (index < 0) index = 0;
  if (index >= allSelectables.length) index = allSelectables.length - 1;
  selectedIndex = index;

  allSelectables.forEach((el, idx) => {
    if (idx === selectedIndex) {
      el.classList.add('selected');
    } else {
      el.classList.remove('selected');
    }
  });
}

// Dynamic prompt update
input.addEventListener('input', () => {
  const query = input.value.trim();
  if (query.length > 0) {
    const displayQuery = query.length > 40 ? query.substring(0, 37) + '...' : query;
    actionTitle.textContent = `New task: "${displayQuery}"`;
    actionHint.textContent = 'Enter ↵';
  } else {
    actionTitle.textContent = 'New task';
    actionHint.textContent = 'Tab+N / N';
  }
});

// Submit prompt to Python backend
async function submitTask() {
  const prompt = input.value.trim();
  if (!prompt || isBusy) return;

  isBusy = true;
  input.disabled = true;

  statusText.className = 'status-text working';
  statusText.textContent = '⏳ Ghost is creating task...';
  actionTitle.textContent = 'Creating task in TickTick...';
  actionHint.textContent = 'Running...';

  try {
    const result = await window.ghostAPI.runPrompt(prompt);
    const isError = result.toLowerCase().startsWith('error');

    statusText.className = isError ? 'status-text error' : 'status-text success';
    statusText.textContent = (isError ? '✗ ' : '✓ ') + result;
    actionTitle.textContent = (isError ? '✗ ' : '✓ ') + result;
    actionHint.textContent = 'Done';

    // Auto-close after completion
    setTimeout(() => {
      window.ghostAPI.closeWindow();
    }, 2400);
  } catch (err) {
    statusText.className = 'status-text error';
    statusText.textContent = `✗ Error: ${err.message}`;
    isBusy = false;
    input.disabled = false;
  }
}

// Keyboard shortcuts & navigation
window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    window.ghostAPI.closeWindow();
    return;
  }

  if (e.key === 'ArrowDown') {
    e.preventDefault();
    updateSelection(selectedIndex + 1);
    return;
  }

  if (e.key === 'ArrowUp') {
    e.preventDefault();
    updateSelection(selectedIndex - 1);
    return;
  }

  if (e.key === 'Enter') {
    e.preventDefault();
    if (selectedIndex === 0 || input.value.trim()) {
      submitTask();
    } else {
      // If a navigation item is selected
      const selectedEl = allSelectables[selectedIndex];
      const title = selectedEl.querySelector('.item-title')?.textContent || '';
      input.value = `Open ${title.toLowerCase()}`;
      input.dispatchEvent(new Event('input'));
      updateSelection(0);
    }
  }
});

// Click handlers
actionNewTask.addEventListener('click', () => {
  updateSelection(0);
  if (input.value.trim()) {
    submitTask();
  } else {
    input.focus();
  }
});

document.querySelectorAll('.nav-item').forEach((el, index) => {
  el.addEventListener('click', () => {
    updateSelection(index + 1);
    const title = el.querySelector('.item-title')?.textContent || '';
    input.value = `Show ${title.toLowerCase()}`;
    input.dispatchEvent(new Event('input'));
    input.focus();
  });
});

// Focus on start
input.focus();
