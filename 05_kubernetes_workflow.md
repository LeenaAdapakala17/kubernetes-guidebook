# Kubernetes Workflow: How It Works in Real-Time

You've learned about Kubernetes' architecture and its individual components. Now, let's put it all together and walk through a typical workflow of deploying and managing an application in a Kubernetes cluster. This will show how the various components interact to achieve the desired state.

## The Desired State vs. Current State

At the heart of Kubernetes is the concept of **desired state**. You, as the user, declare *what* you want your application to look like (e.g., "I want 3 replicas of my Nginx container, exposed on port 80"). Kubernetes then continuously works to make the *current state* of the cluster match your *desired state*.

## Typical Application Deployment Workflow

Let's imagine you want to deploy your `my-node-app` (from the previous section) to Kubernetes.

### Step 1: User Defines Desired State (YAML Manifest)

You, the developer or operator, create YAML files (called manifests) that describe your application's desired state. This typically includes:

*   **Deployment:** How many Pods (replicas) of your application should run, which Docker image to use, resource limits, etc.
*   **Service:** How to expose your application to other services or the outside world (e.g., via a LoadBalancer).

Example `my-node-app-deployment.yaml`:
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-node-app-deployment
spec:
  replicas: 2 # Desired state: 2 instances of our app
  selector:
    matchLabels:
      app: my-node-app
  template:
    metadata:
      labels:
        app: my-node-app
    spec:
      containers:
      - name: my-node-app-container
        image: my-node-app:1.0 # Our custom image
        ports:
        - containerPort: 3000 # App listens on port 3000
```

Example `my-node-app-service.yaml`:
```yaml
apiVersion: v1
kind: Service
metadata:
  name: my-node-app-service
spec:
  selector:
    app: my-node-app
  ports:
    - protocol: TCP
      port: 80 # Service will be exposed on port 80
      targetPort: 3000 # Traffic forwarded to container's port 3000
  type: LoadBalancer # Expose externally (e.g., via cloud load balancer)
```

### Step 2: User Submits Desired State (`kubectl apply`)

You use the `kubectl` command-line tool to send these YAML manifests to the Kubernetes cluster:

```bash
kubectl apply -f my-node-app-deployment.yaml
kubectl apply -f my-node-app-service.yaml
```

### Step 3: `kube-apiserver` Receives and Stores

*   The `kubectl` command sends your order to the **`kube-apiserver` (the Head Waiter)**.
*   The Head Waiter validates your order and writes it down in the **`etcd` (the Recipe Book)**. The desired state is now officially recorded.

### Step 4: Controllers Detect Changes

*   The **`kube-controller-manager` (the Kitchen Manager)** is always watching the Recipe Book. It sees the new order for `my-node-app-deployment`.

### Step 5: Deployment Controller Creates ReplicaSet and Pods

*   The Kitchen Manager knows this order requires 2 identical dishes (`replicas: 2`). It creates a work ticket (a **ReplicaSet**) to track this.
*   The ReplicaSet then officially places the order for two individual dishes (two **Pod** objects). These orders are marked as "pending" because they haven't been assigned to a kitchen station yet.

### Step 6: `kube-scheduler` Assigns Pods to Nodes

*   The **`kube-scheduler` (the Expeditor)** sees the two pending orders. It checks which kitchen stations (**Worker Nodes**) are available and best suited for the job.
*   It assigns one order to Station A and the other to Station B, updating the Recipe Book with this decision.

### Step 7: `kubelet` Starts Containers on Worker Nodes

*   On each assigned Worker Node, the **`kubelet` (the Station Chef)** sees the order assigned to its station.
*   The Station Chef gets to work, telling the **Container Runtime** (the cooking equipment) to:
    *   Pull the `my-node-app:1.0` Docker image from the registry.
    *   Create and start the container(s) defined in the Pod's specification.
*   The Station Chef then reports back to the Head Waiter that the dish is prepared and running.

### Step 8: `kube-proxy` Configures Networking

*   The **`kube-proxy` (the Food Runner)** on each station sees the new Service.
*   It sets up the internal pathways (network rules) so that traffic can find these new dishes and be balanced between them.
*   If a `LoadBalancer` is requested, the `cloud-controller-manager` calls out to the restaurant's main delivery service (the cloud provider) to get an external delivery address.

### Step 9: Application is Accessible

Your `my-node-app` is now being "cooked" on two different stations, and the internal runners know how to get traffic to them. The application is live!

## Handling Changes and Failures (Self-Healing & Scaling)

The restaurant analogy continues to hold true for ongoing management:

*   **Pod Failure (Dish is Burnt):** If a Pod crashes, the Station Chef (`kubelet`) reports it. The Kitchen Manager (`kube-controller-manager`) sees that only 1 dish is available instead of the desired 2. It immediately orders a new one, and the process from Step 6 repeats to replace the burnt dish.
*   **Node Failure (Station Breaks Down):** If an entire Worker Node fails, the Kitchen Manager sees this and re-schedules all the dishes that were being made there to other, healthy stations.
*   **Scaling (Sudden Rush of Customers):** If you update your order to 5 replicas, the Kitchen Manager sees the new desired state and immediately orders 3 more dishes, which the Expeditor then assigns to the best available stations.
*   **Updates/Rollouts (New Recipe Version):** When you update the recipe (a new image version), the Kitchen Manager carefully brings out the new dishes one by one while removing the old ones, ensuring customers never notice the change.

This continuous reconciliation loop is what makes Kubernetes so powerful for managing resilient and scalable applications.

---

**Hands-on Task: Deploying an Application to a Local Kubernetes Cluster**

*(This section would guide the user through setting up a local Kubernetes cluster (e.g., Minikube), applying the `my-node-app` Deployment and Service YAMLs, verifying their status, and accessing the application.)*

*(Example: `minikube start`, `kubectl apply -f .`, `kubectl get pods`, `kubectl get svc`, `minikube service my-node-app-service`)*