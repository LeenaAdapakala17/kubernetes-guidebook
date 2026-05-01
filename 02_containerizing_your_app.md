# Containerizing Your First Application

Now that you understand what a container is and have run a pre-built Nginx container, let's learn how to package your own application into a Docker image. This process is called **containerization**.

## What is a Docker Image?

A Docker image is a read-only template that contains a set of instructions for creating a container. It includes the application code, a runtime, libraries, environment variables, and configuration files needed for the application to run. Images are built from a `Dockerfile`.

## What is a Dockerfile?

A `Dockerfile` is a plain text file that contains all the commands a user could call on the command line to assemble an image. Docker reads these instructions and executes them sequentially to create a Docker image.

## Hands-on Task: Containerizing a Simple Node.js App

We'll create a basic Node.js web server and then build a Docker image for it.

**1. Create a Project Directory:**

Open your Ubuntu terminal and create a new directory for your project:

```bash
mkdir my-node-app
cd my-node-app
```

**2. Create the Node.js Application File (`app.js`):**

Create a file named `app.js` inside the `my-node-app` directory:

```bash
nano app.js
```

Paste the following code into `app.js` and save (Ctrl+O, Enter, Ctrl+X if using `nano`):

```javascript
const http = require('http');

const hostname = '0.0.0.0'; // Listen on all available network interfaces
const port = 3000;

const server = http.createServer((req, res) => {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/plain');
  res.end('Hello from my container!\n');
});

server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});
```

**3. Create a `package.json` file:**

For Node.js projects, `package.json` manages dependencies. Create it in the `my-node-app` directory:

```bash
nano package.json
```

Paste the following code into `package.json` and save:

```json
{
  "name": "my-node-app",
  "version": "1.0.0",
  "description": "A simple Node.js app in a Docker container",
  "main": "app.js",
  "scripts": {
    "start": "node app.js"
  },
  "author": "",
  "license": "ISC"
}
```

**4. Create the `Dockerfile`:**

In the same `my-node-app` directory, create a file named `Dockerfile` (note the capital 'D' and no file extension):

```bash
nano Dockerfile
```

Paste the following instructions into `Dockerfile` and save:

```dockerfile
# Use an official Node.js runtime as a parent image
FROM node:18-alpine

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json (if any) to install dependencies
# This is done separately to leverage Docker's build cache
COPY package*.json ./

# Install app dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Expose the port the app runs on
EXPOSE 3000

# Define the command to run the app
CMD [ "node", "app.js" ]
```

**5. Build Your Docker Image:**

From within the `my-node-app` directory in your Ubuntu terminal, run the `docker build` command:

```bash
docker build -t my-node-app:1.0 .
```

**6. Run Your Custom Container:**

Once the image is built, run a container from it:

```bash
docker run -d -p 8080:3000 --name my-custom-app my-node-app:1.0
```

**7. Verify and Access Your Application:**

*   **Check container status:**
    ```bash
    docker ps
    ```
    You should see `my-custom-app` running.

*   **Access your app:**
    Open your web browser (on your Windows machine) and navigate to:
    ```
    http://localhost:8080/
    ```
    You should see the message "Hello from my container!".

**8. Cleanup (Optional):**

When you are finished, you can stop and remove your custom container:

```bash
docker stop my-custom-app
docker rm my-custom-app
```