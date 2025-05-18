from kubernetes import client, config

def test_k8s_access():
    try:
        # Try to load the kubernetes configuration
        try:
            config.load_incluster_config()
            print("Using in-cluster configuration")
        except config.ConfigException:
            config.load_kube_config()
            contexts, active_context = config.list_kube_config_contexts()
            print(f"Using local kubeconfig")
            print(f"Active context: {active_context['name']}")
            print(f"Available contexts: {[ctx['name'] for ctx in contexts]}")

        # Create API client
        v1 = client.CoreV1Api()
        
        # Test namespace listing
        print("\nTesting namespace listing:")
        namespaces = v1.list_namespace()
        print(f"Successfully listed {len(namespaces.items)} namespaces:")
        for ns in namespaces.items:
            print(f"- {ns.metadata.name}")
            
    except Exception as e:
        print(f"\nError: {str(e)}")
        print(f"Error type: {type(e).__name__}")
        if hasattr(e, 'status') and hasattr(e, 'reason'):
            print(f"Status: {e.status}")
            print(f"Reason: {e.reason}")
            if hasattr(e, 'body'):
                print(f"Body: {e.body}")

if __name__ == "__main__":
    test_k8s_access() 