You are an experienced software developer. Please build a clean, modular React component written in TypeScript for a desktop application built with Electron and Vite. The component represents the central chat window in the application "KiKi" and belongs to the module "chat.ui-chat-window".

🧩 Requirements:

1. The chat window should include:
   - A scrollable list of messages (from user and assistant)
   - Visually distinguishable user and assistant messages
   - A text input field at the bottom with a send button
   - Pressing Enter should also trigger the send
   - The input field should clear after sending
   - Automatically scroll to the newest message when added

2. The component should be fully reusable and receive these props:
   ```ts
   messages: { role: 'user' | 'assistant'; content: string }[]
   onSendMessage: (message: string) => void
The component itself does not manage the chat history.
All chat messages are passed in via props.
User input is returned via the onSendMessage() callback.

Use clean functional components and modern React (hooks such as useState, useEffect, useRef).
The layout should be responsive and styled using TailwindCSS or simple elegant CSS.

Structure the code clearly and place everything in a single file named ChatWindow.tsx inside the renderer/components/ folder.
Add minimal but meaningful comments.

💡 The code should be directly usable in a typical Vite + React + TypeScript + Electron setup.
No server-side rendering, no routing, no backend. Only client-side logic.

Provide only the full content of ChatWindow.tsx and nothing else.