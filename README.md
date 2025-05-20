# Kubernetes Access Manager

A modern web application for generating Kubernetes RBAC configurations and kubeconfig files with a beautiful, user-friendly interface.

![1000137286](https://github.com/user-attachments/assets/f84918dc-a582-43c9-ab15-af1bce1c09be)


## Features

- 🔐 **Role Generator**: Create Kubernetes RBAC roles with fine-grained permissions
- 📄 **Kubeconfig Generator**: Generate kubeconfig files for service accounts
- 🎯 **Resource-specific Permissions**: Control access to specific Kubernetes resources
- 📊 **Namespace Support**: Generate configurations for specific namespaces
- 🎨 **Modern UI**: Beautiful and intuitive user interface with Material-UI
- ⚡ **Fast & Responsive**: Built with React and Vite for optimal performance

## Supported Resources

- **Core Resources**: Pods, Services, ConfigMaps, Secrets, etc.
- **Apps**: Deployments, StatefulSets, DaemonSets, ReplicaSets
- **Networking**: Ingresses, NetworkPolicies
- **RBAC**: Roles, ClusterRoles, RoleBindings
- **Other**: HorizontalPodAutoscalers, PodDisruptionBudgets, PersistentVolumes

## Prerequisites

- Node.js 18+ for frontend
- Python 3.8+ for backend
- Kubernetes cluster for deployment (optional)

## Quick Start

1. Clone the repository:
```bash
git clone https://github.com/yourusername/kubeconfig-generator.git
cd kubeconfig-generator
```

2. Start the development environment:
```bash
./start-dev.sh
```

This will start both the frontend and backend servers:
- Frontend: http://localhost:5173
- Backend: http://localhost:5005

## Development Setup

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: .\venv\Scripts\activate
pip install -r requirements.txt
python app.py
```

## Environment Variables

### Frontend
- `VITE_API_BASE_URL`: Backend API URL (default: http://localhost:5005)

### Backend
- `FLASK_ENV`: Development/production environment
- `FLASK_APP`: Application entry point
- `KUBERNETES_SERVICE_HOST`: Kubernetes API server host (optional)
- `KUBERNETES_SERVICE_PORT`: Kubernetes API server port (optional)

## Docker Deployment

Build and run the containers:

```bash
# Build images
docker build -t k8s-access-manager-frontend ./frontend
docker build -t k8s-access-manager-backend ./backend

# Run containers
docker-compose up -d
```

## Kubernetes Deployment

The application can be deployed to Kubernetes using the provided Helm chart:

```bash
helm install kubeconfig-generator ./charts/kubeconfig-generator
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the GNU General Public License (GPL) v3.0 - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Built with [React](https://reactjs.org/)
- Styled with [Material-UI](https://mui.com/)
- Powered by [Vite](https://vitejs.dev/)
- Backend with [Flask](https://flask.palletsprojects.com/) 
