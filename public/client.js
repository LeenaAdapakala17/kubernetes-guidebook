document.addEventListener('DOMContentLoaded', () => {
    const contentArea = document.getElementById('content-area');
    const pageInfo = document.getElementById('page-info');
    const nextButton = document.getElementById('next-button');
    const prevButton = document.getElementById('prev-button'); // New: Previous button
    const questionInput = document.getElementById('question-input');
    const askButton = document.getElementById('ask-button');
    const aiResponseArea = document.getElementById('ai-response-area');

    let currentPage = 0;
    let totalPages = 0;

    // --- WebSocket Setup ---
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${protocol}//${window.location.host}`);

    ws.onopen = () => {
        console.log('WebSocket connection established.');
    };

    ws.onmessage = (event) => {
        try {
            const message = JSON.parse(event.data);
            switch (message.type) {
                case 'ai-start':
                    aiResponseArea.textContent = ''; // Clear "Thinking..." message
                    break;
                case 'ai-chunk':
                    aiResponseArea.textContent += message.payload;
                    break;
                case 'ai-done':
                    // The AI is finished responding.
                    break;
                case 'ai-error':
                    aiResponseArea.textContent = `Error: ${message.payload}`;
                    break;
            }
        } catch (error) {
            console.error("Failed to parse WebSocket message:", event.data, error);
            aiResponseArea.textContent = 'Received an invalid message from the server.';
        }
    };

    ws.onclose = () => {
        console.log('WebSocket connection closed.');
        aiResponseArea.textContent = 'Connection to server lost. Please refresh the page.';
        askButton.disabled = true;
        questionInput.disabled = true;
    };

    // --- Page Loading Logic ---
    async function loadPage(pageIndex) {
        const isInitialLoad = totalPages === 0;
        const direction = pageIndex > currentPage ? 'next' : 'prev';

        // 1. Animate out the old content
        if (!isInitialLoad) {
            contentArea.classList.add(direction === 'next' ? 'page-exit-left' : 'page-exit-right');
            await new Promise(resolve => setTimeout(resolve, 300)); // Match animation duration
        }

        try {
            // 2. Fetch new content
            const response = await fetch(`/api/page/${pageIndex}`);
            if (!response.ok) throw new Error('Failed to load page.');
            
            const data = await response.json();
            
            // 3. Prepare for enter animation and update content
            contentArea.classList.remove('page-exit-left', 'page-exit-right');
            
            if (isInitialLoad) {
                contentArea.classList.add('initial-load');
            } else {
                contentArea.classList.add(direction === 'next' ? 'page-enter-from-right' : 'page-enter-from-left');
            }

            contentArea.innerHTML = data.content;
            pageInfo.textContent = `Page ${data.page} of ${data.totalPages}`;
            document.body.dataset.page = pageIndex; // Add page index to body for styling
            currentPage = pageIndex;
            totalPages = data.totalPages;
            nextButton.disabled = (currentPage >= totalPages - 1);
            prevButton.disabled = (currentPage === 0); // New: Disable prev button on first page
            aiResponseArea.textContent = ''; // Clear previous AI response

            // 4. Clean up animation class after it finishes
            const animationDuration = isInitialLoad ? 600 : 300;
            setTimeout(() => {
                contentArea.classList.remove('page-enter-from-right', 'page-enter-from-left', 'initial-load');
            }, animationDuration);

        } catch (error) {
            contentArea.innerHTML = `<p>Error loading content: ${error.message}</p>`;
            contentArea.classList.remove('page-exit-left', 'page-exit-right', 'page-enter-from-right', 'page-enter-from-left', 'initial-load');
        }
    }

    // --- Event Listeners ---
    nextButton.addEventListener('click', () => {
        if (currentPage < totalPages - 1) {
            loadPage(currentPage + 1);
        }
    });

    // New: Previous button event listener
    prevButton.addEventListener('click', () => {
        if (currentPage > 0) {
            loadPage(currentPage - 1);
        }
    });

    function askQuestion() {
        const question = questionInput.value.trim();
        if (question && ws.readyState === WebSocket.OPEN) {
            aiResponseArea.textContent = '🤖 Thinking...'; // Initial feedback
            ws.send(JSON.stringify({
                type: 'question',
                question: question,
                pageIndex: currentPage
            }));
            questionInput.value = '';
        }
    }

    askButton.addEventListener('click', askQuestion);
    questionInput.addEventListener('keyup', (event) => {
        if (event.key === 'Enter') askQuestion();
    });

    // --- Initial Load ---
    loadPage(0);
});