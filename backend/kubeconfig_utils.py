import yaml
from kubernetes import client
from kubernetes.client.rest import ApiException
import base64
import time

def create_service_account(api, name, namespace):
    """Create a ServiceAccount in the specified namespace."""
    try:
        print(f"Creating ServiceAccount {name} in namespace {namespace}")
        body = client.V1ServiceAccount(
            metadata=client.V1ObjectMeta(
                name=name,
                namespace=namespace
            )
        )
        return api.create_namespaced_service_account(namespace, body)
    except Exception as e:
        print(f"Error creating ServiceAccount: {str(e)}")
        raise

def create_role(api, name, namespace, permissions):
    """Create a Role with the specified permissions."""
    try:
        print(f"Creating Role {name} in namespace {namespace}")
        rules = []
        for perm in permissions:
            api_group = perm.get('apiGroup', '')
            api_groups = [api_group] if api_group else ['']
            print(f"Adding permission: resource={perm['resource']}, apiGroups={api_groups}, verbs={perm['verbs']}")
            rules.append(client.V1PolicyRule(
                api_groups=api_groups,
                resources=[perm['resource']],
                verbs=perm['verbs']
            ))

        body = client.V1Role(
            metadata=client.V1ObjectMeta(
                name=name,
                namespace=namespace
            ),
            rules=rules
        )
        return api.create_namespaced_role(namespace, body)
    except Exception as e:
        print(f"Error creating Role: {str(e)}")
        import traceback
        print(f"Traceback: {traceback.format_exc()}")
        raise

def create_role_binding(api, name, namespace, role_name, sa_name):
    """Create a RoleBinding to bind the Role to the ServiceAccount."""
    try:
        print(f"Creating RoleBinding {name} in namespace {namespace}")
        body = client.V1RoleBinding(
            metadata=client.V1ObjectMeta(
                name=name,
                namespace=namespace
            ),
            role_ref=client.V1RoleRef(
                api_group='rbac.authorization.k8s.io',
                kind='Role',
                name=role_name
            ),
            subjects=[{
                'kind': 'ServiceAccount',
                'name': sa_name,
                'namespace': namespace
            }]
        )
        return api.create_namespaced_role_binding(namespace, body)
    except Exception as e:
        print(f"Error creating RoleBinding: {str(e)}")
        raise

def get_service_account_token(api, sa_name, namespace):
    """Get the token for a ServiceAccount."""
    try:
        print(f"Getting token for ServiceAccount {sa_name} in namespace {namespace}")
        
        # Create a token using the newer API
        print("Creating token using TokenRequest API...")
        api_instance = client.CoreV1Api()
        
        try:
            token_request = {
                "apiVersion": "authentication.k8s.io/v1",
                "kind": "TokenRequest",
                "spec": {
                    "audiences": ["https://kubernetes.default.svc"],
                    "expirationSeconds": 31536000  # 1 year
                }
            }

            token_response = api_instance.create_namespaced_service_account_token(
                name=sa_name,
                namespace=namespace,
                body=token_request
            )
            
            if hasattr(token_response, 'status') and hasattr(token_response.status, 'token'):
                print("Successfully generated token")
                return token_response.status.token
            else:
                print("Token response missing expected attributes:", token_response)
                return None
                
        except ApiException as e:
            print(f"API Exception during token creation: status={e.status}, reason={e.reason}")
            print(f"Response body: {e.body}")
            
            # Fallback to creating a secret manually
            print("Attempting fallback: creating token secret manually...")
            secret = client.V1Secret(
                metadata=client.V1ObjectMeta(
                    name=f"{sa_name}-token",
                    annotations={
                        "kubernetes.io/service-account.name": sa_name,
                    }
                ),
                type="kubernetes.io/service-account-token"
            )
            
            created_secret = api.create_namespaced_secret(namespace, secret)
            print(f"Created token secret: {created_secret.metadata.name}")
            
            # Wait a moment for the token controller to populate the secret
            time.sleep(2)
            
            # Get the updated secret
            updated_secret = api.read_namespaced_secret(created_secret.metadata.name, namespace)
            if updated_secret.data and 'token' in updated_secret.data:
                print("Successfully retrieved token from created secret")
                return base64.b64decode(updated_secret.data['token']).decode('utf-8')
            
            print("Failed to get token from created secret")
            return None
            
    except Exception as e:
        print(f"Unexpected error getting token: {str(e)}")
        import traceback
        print(f"Traceback: {traceback.format_exc()}")
        return None

def create_kubeconfig(cluster_name, api_server, ca_cert_data, namespace, token, user_name):
    """Generate a kubeconfig file with the specified parameters."""
    try:
        print(f"Creating kubeconfig for user {user_name} in namespace {namespace}")
        config = {
            'apiVersion': 'v1',
            'kind': 'Config',
            'current-context': f'{user_name}@{cluster_name}',
            'clusters': [{
                'name': cluster_name,
                'cluster': {
                    'server': api_server,
                    'certificate-authority-data': ca_cert_data
                }
            }],
            'contexts': [{
                'name': f'{user_name}@{cluster_name}',
                'context': {
                    'cluster': cluster_name,
                    'namespace': namespace,
                    'user': user_name
                }
            }],
            'users': [{
                'name': user_name,
                'user': {
                    'token': token
                }
            }]
        }
        
        return yaml.dump(config, default_flow_style=False)
    except Exception as e:
        print(f"Error creating kubeconfig: {str(e)}")
        raise