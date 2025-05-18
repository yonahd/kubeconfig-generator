from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from kubernetes import client, config
from kubernetes.client.rest import ApiException
import yaml
import base64
import os
from kubeconfig_utils import (
    create_kubeconfig,
    create_service_account,
    create_role,
    create_role_binding,
    get_service_account_token
)

app = Flask(__name__)
CORS(app)

# Initialize Kubernetes client
try:
    # Try to load from within cluster first
    config.load_incluster_config()
    print("Running with in-cluster configuration")
except config.ConfigException:
    # Fall back to local kubeconfig
    config.load_kube_config()
    contexts, active_context = config.list_kube_config_contexts()
    print(f"Running with local kubeconfig")
    print(f"Current context: {active_context['name']}")
    print(f"Available contexts: {[ctx['name'] for ctx in contexts]}")

# Initialize API clients
core_v1 = client.CoreV1Api()
rbac_v1 = client.RbacAuthorizationV1Api()
api_client = client.ApiClient()

@app.route('/api/namespaces', methods=['GET'])
def get_namespaces():
    """Get list of available namespaces."""
    try:
        print("Attempting to list namespaces...")
        namespaces = core_v1.list_namespace()
        namespace_list = [ns.metadata.name for ns in namespaces.items]
        print(f"Successfully retrieved {len(namespace_list)} namespaces")
        return jsonify({
            'namespaces': namespace_list
        })
    except ApiException as e:
        print(f"Kubernetes API Exception: {e.status} - {e.reason}")
        print(f"Response body: {e.body}")
        return jsonify({
            'error': str(e),
            'status': e.status,
            'reason': e.reason,
            'body': e.body
        }), e.status
    except Exception as e:
        print(f"Unexpected error: {str(e)}")
        return jsonify({
            'error': str(e),
            'type': type(e).__name__
        }), 500

@app.route('/api/resources', methods=['GET'])
def get_api_resources():
    """Get available API resources and their verbs."""
    try:
        api_resources = {}
        
        # Get API groups
        groups = client.ApisApi().get_api_groups()
        
        # Get core API resources (v1)
        core_apis = client.CoreV1Api().get_api_resources()
        api_resources[''] = [{
            'name': resource.name,
            'verbs': resource.verbs,
            'namespaced': resource.namespaced
        } for resource in core_apis.resources if '/' not in resource.name]

        # Get resources from each API group
        for group in groups.groups:
            group_version = group.preferred_version.group_version
            api = client.CustomObjectsApi()
            
            try:
                group_resources = api_client.call_api(
                    f'/apis/{group_version}',
                    'GET',
                    response_type='json'
                )[0]['resources']
                
                api_resources[group.name] = [{
                    'name': resource['name'],
                    'verbs': resource['verbs'],
                    'namespaced': resource['namespaced']
                } for resource in group_resources if '/' not in resource['name']]
            except:
                continue

        return jsonify(api_resources)
    except ApiException as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/generate-role', methods=['POST'])
def generate_role():
    try:
        data = request.json
        name = data.get('name')
        namespace = data.get('namespace', 'default')
        permissions = data.get('permissions', [])

        if not all([name, namespace, permissions]):
            return jsonify({'error': 'Missing required fields'}), 400

        # Create the role
        api = client.RbacAuthorizationV1Api()
        
        role = create_role(api, name, namespace, permissions)
        
        # Generate and return the role YAML
        role_yaml = yaml.dump(client.ApiClient().sanitize_for_serialization(role))
        
        return jsonify({
            'message': 'Role created successfully',
            'role': role_yaml
        })

    except Exception as e:
        print(f"Error in generate_role: {str(e)}")
        print(f"Error type: {type(e)}")
        import traceback
        print(f"Traceback: {traceback.format_exc()}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/generate-kubeconfig', methods=['POST'])
def generate_kubeconfig():
    """Generate kubeconfig with specified permissions."""
    try:
        print("Received generate-kubeconfig request")
        data = request.get_json()
        if not data:
            print("No data provided in request")
            return jsonify({'error': 'No data provided'}), 400

        name = data.get('name')
        namespace = data.get('namespace', 'default')
        resources = data.get('resources', [])
        verbs = data.get('verbs', [])
        
        print(f"Request data: namespace={namespace}, name={name}")
        print(f"Resources: {resources}")
        print(f"Verbs: {verbs}")
        
        if not all([name, namespace, resources, verbs]):
            print("Missing required fields")
            return jsonify({'error': 'Missing required fields'}), 400

        # Initialize Kubernetes API clients
        core_api = client.CoreV1Api()
        rbac_api = client.RbacAuthorizationV1Api()

        # Create ServiceAccount
        print("Creating ServiceAccount...")
        sa = create_service_account(core_api, name, namespace)
        print(f"ServiceAccount created: {sa.metadata.name}")
        
        # Create Role with specified permissions
        print("Creating Role...")
        permissions = [{'resource': resource, 'verbs': verbs} for resource in resources]
        role = create_role(rbac_api, name, namespace, permissions)
        print(f"Role created: {role.metadata.name}")
        
        # Create RoleBinding
        print("Creating RoleBinding...")
        role_binding = create_role_binding(rbac_api, name, namespace, name, name)
        print(f"RoleBinding created: {role_binding.metadata.name}")
        
        # Get ServiceAccount token
        print("Getting ServiceAccount token...")
        token = get_service_account_token(core_api, name, namespace)
        if not token:
            print("Failed to get ServiceAccount token")
            return jsonify({'error': 'Failed to get ServiceAccount token'}), 500
        print("Successfully obtained ServiceAccount token")

        # Get cluster information
        print("Getting cluster information...")
        cluster_info = core_api.api_client.configuration
        api_server = cluster_info.host
        ca_cert_data = ""
        if cluster_info.ssl_ca_cert:
            ca_cert_path = cluster_info.ssl_ca_cert
            print(f"CA Certificate Path: {ca_cert_path}")

            # Check if the path exists and is a file
            if os.path.exists(ca_cert_path) and os.path.isfile(ca_cert_path):
                try:
                    with open(ca_cert_path, 'rb') as f: # Open in binary read mode
                        ca_cert_data = base64.b64encode(f.read()).decode('utf-8')
                    print("CA Certificate data successfully read and base64 encoded.")
                    # print(f"Base64 encoded CA Cert (first 50 chars): {ca_cert_data[:50]}...") # Optional: print a snippet
                except IOError as e:
                    print(f"Error reading CA certificate file '{ca_cert_path}': {e}")
            else:
                print(f"Warning: CA certificate file not found or is not a file: {ca_cert_path}")
        else:
            print("No SSL CA Certificate specified in Kubernetes configuration.")
        cluster_name = os.getenv('CLUSTER_NAME', 'kubernetes')
        print(f"Using cluster name: {cluster_name}")
        print(f"Using API server: {api_server}")

        # Generate kubeconfig
        print("Generating kubeconfig...")
        kubeconfig = create_kubeconfig(
            cluster_name=cluster_name,
            api_server=api_server,
            ca_cert_data=ca_cert_data,
            namespace=namespace,
            token=token,
            user_name=name
        )
        print("Kubeconfig generated successfully")

        return jsonify({
            'message': 'Kubeconfig generated successfully',
            'kubeconfig': kubeconfig
        })

    except Exception as e:
        print(f"Error in generate_kubeconfig: {str(e)}")
        print(f"Error type: {type(e)}")
        import traceback
        print(f"Traceback: {traceback.format_exc()}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5005)