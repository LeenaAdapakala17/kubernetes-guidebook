# Interactive Kubernetes Guidebook

[![Live Application](https://img.shields.io/badge/Live%20App-View%20Here-brightgreen?style=for-the-badge)](https://leena-k8s-guidebook.onrender.com/)

An interactive, full-stack web application designed to make learning Kubernetes simple, engaging, and hands-on. This guidebook features high-quality content, a unique book-like design, and an integrated AI assistant to answer your questions in real-time.

*(It is highly recommended to add a screenshot or a short screen recording GIF here to showcase the application!)*

## ✨ Key Features

*   **Interactive AI Assistant:** Powered by the Groq Llama 3.1 API, you can ask questions about any topic on the page and get instant, context-aware answers.
*   **Comprehensive Content:** In-depth chapters covering everything from the basics of containers to real-world CI/CD workflows, all explained with a simple and memorable restaurant analogy.
*   **Polished User Experience:** A custom-designed, book-like interface with elegant page-turning animations and a unique, shining title to create a premium feel.
*   **Full-Stack Implementation:** Built from the ground up with a Node.js backend and a responsive vanilla JavaScript front-end.
*   **Real-time Communication:** Utilizes WebSockets for instant, streaming responses from the AI assistant.

## 🛠️ Tech Stack

*   **Backend:** Node.js, Express.js
*   **Real-time Communication:** WebSockets (`ws` library)
*   **Frontend:** HTML5, CSS3, Vanilla JavaScript
*   **AI Integration:** Groq API (Llama 3.1 Model)
*   **Deployment:** Render

## 🚀 How to Run Locally

To run this project on your local machine, follow these steps:

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/LeenaAdapakala17/kubernetes-guidebook.git
    cd kubernetes-guidebook
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Create an environment file:**
    Create a `.env` file in the root of the project and add your Groq API key:
    ```
    GROQ_API_KEY=YOUR_GROQ_API_KEY_HERE
    ```

4.  **Start the application:**
    ```bash
    npm start
    ```
    The application will be available at `http://localhost:3000`.

## ✍️ Author

This project was designed and developed by **Leena Adapakala**.