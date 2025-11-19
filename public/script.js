const chat = document.getElementById('chat');
const queryInput = document.getElementById('query');
const sendButton = document.querySelector('button');

function addMessage(text, sender) {
  const bubble = document.createElement('div');

  const isUser = sender === 'user';

  bubble.className = `
    w-fit max-w-[75ch] break-words px-4 py-2 rounded-lg 
    ${isUser ? 'bg-blue-600 text-white ml-auto' : 'bg-gray-200 text-gray-800 mr-auto'}
  `;
  if (!isUser) {
    bubble.innerHTML = marked.parse(text);
  } else {
    bubble.textContent = text;
  }

  chat.appendChild(bubble);
  chat.scrollTop = chat.scrollHeight;
}

function showLoader() {
  queryInput.disabled = true;
  sendButton.disabled = true;
  sendButton.classList.add('opacity-50', 'cursor-not-allowed');

  const loader = document.createElement('div');
  loader.id = 'loader';
  loader.className = `
    w-fit max-w-[75ch] break-words px-4 py-2 rounded-lg
    bg-gray-200 text-gray-600 italic mr-auto
  `;
  loader.textContent = 'Thinking...';
  chat.appendChild(loader);
  chat.scrollTop = chat.scrollHeight;
}

function hideLoader() {
  queryInput.disabled = false;
  sendButton.disabled = false;
  sendButton.classList.remove('opacity-50', 'cursor-not-allowed');

  const loader = document.getElementById('loader');
  if (loader) loader.remove();
}

async function ask() {
  const query = document.getElementById('query').value;
  if (!query.trim()) return;

  addMessage(query, 'user');
  document.getElementById('query').value = '';

  showLoader();

  const res = await fetch('/ask', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  });

  const data = await res.json();

  hideLoader();
  addMessage(data.answer, 'bot');
}

queryInput.addEventListener('keydown', event => {
  if (event.key === 'Enter') {
    event.preventDefault(); // prevent newline
    if (queryInput.value.trim()) {
      ask();
    }
  }
});
