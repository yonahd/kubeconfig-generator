import { useState } from 'react';
import { useNamespaces } from '../hooks/useNamespaces';
import { API_BASE_URL } from '../config';

interface Resource {
  name: string;
  apiGroup: string;
  verbs: string[];
  isExpanded: boolean;
  selected: boolean;
  selectedVerbs: string[];
}

const AVAILABLE_VERBS = ['get', 'list', 'watch', 'create', 'update', 'patch', 'delete'];

const INITIAL_RESOURCES: Resource[] = [
  // Core API Group ("")
  { 
    name: 'pods', 
    apiGroup: '', 
    verbs: AVAILABLE_VERBS,
    isExpanded: false,
    selected: false,
    selectedVerbs: []
  },
  { 
    name: 'services', 
    apiGroup: '', 
    verbs: AVAILABLE_VERBS,
    isExpanded: false,
    selected: false,
    selectedVerbs: []
  },
  { 
    name: 'configmaps', 
    apiGroup: '', 
    verbs: AVAILABLE_VERBS,
    isExpanded: false,
    selected: false,
    selectedVerbs: []
  },
  { 
    name: 'secrets', 
    apiGroup: '', 
    verbs: AVAILABLE_VERBS,
    isExpanded: false,
    selected: false,
    selectedVerbs: []
  },
  { 
    name: 'serviceaccounts', 
    apiGroup: '', 
    verbs: AVAILABLE_VERBS,
    isExpanded: false,
    selected: false,
    selectedVerbs: []
  },
  { 
    name: 'persistentvolumeclaims', 
    apiGroup: '', 
    verbs: AVAILABLE_VERBS,
    isExpanded: false,
    selected: false,
    selectedVerbs: []
  },
  { 
    name: 'persistentvolumes', 
    apiGroup: '', 
    verbs: AVAILABLE_VERBS,
    isExpanded: false,
    selected: false,
    selectedVerbs: []
  },

  // apps/v1
  { 
    name: 'deployments', 
    apiGroup: 'apps/v1', 
    verbs: AVAILABLE_VERBS,
    isExpanded: false,
    selected: false,
    selectedVerbs: []
  },
  { 
    name: 'statefulsets', 
    apiGroup: 'apps/v1', 
    verbs: AVAILABLE_VERBS,
    isExpanded: false,
    selected: false,
    selectedVerbs: []
  },
  { 
    name: 'daemonsets', 
    apiGroup: 'apps/v1', 
    verbs: AVAILABLE_VERBS,
    isExpanded: false,
    selected: false,
    selectedVerbs: []
  },
  { 
    name: 'replicasets', 
    apiGroup: 'apps/v1', 
    verbs: AVAILABLE_VERBS,
    isExpanded: false,
    selected: false,
    selectedVerbs: []
  },

  // batch/v1
  { 
    name: 'jobs', 
    apiGroup: 'batch/v1', 
    verbs: AVAILABLE_VERBS,
    isExpanded: false,
    selected: false,
    selectedVerbs: []
  },

  // networking.k8s.io/v1
  { 
    name: 'networkpolicies', 
    apiGroup: 'networking.k8s.io/v1', 
    verbs: AVAILABLE_VERBS,
    isExpanded: false,
    selected: false,
    selectedVerbs: []
  },
  { 
    name: 'ingresses', 
    apiGroup: 'networking.k8s.io/v1', 
    verbs: AVAILABLE_VERBS,
    isExpanded: false,
    selected: false,
    selectedVerbs: []
  },

  // autoscaling/v2
  { 
    name: 'horizontalpodautoscalers', 
    apiGroup: 'autoscaling/v2', 
    verbs: AVAILABLE_VERBS,
    isExpanded: false,
    selected: false,
    selectedVerbs: []
  },

  // policy/v1
  { 
    name: 'poddisruptionbudgets', 
    apiGroup: 'policy/v1', 
    verbs: AVAILABLE_VERBS,
    isExpanded: false,
    selected: false,
    selectedVerbs: []
  },

  // rbac.authorization.k8s.io/v1
  { 
    name: 'roles', 
    apiGroup: 'rbac.authorization.k8s.io/v1', 
    verbs: AVAILABLE_VERBS,
    isExpanded: false,
    selected: false,
    selectedVerbs: []
  },
  { 
    name: 'clusterroles', 
    apiGroup: 'rbac.authorization.k8s.io/v1', 
    verbs: AVAILABLE_VERBS,
    isExpanded: false,
    selected: false,
    selectedVerbs: []
  },
  { 
    name: 'rolebindings', 
    apiGroup: 'rbac.authorization.k8s.io/v1', 
    verbs: AVAILABLE_VERBS,
    isExpanded: false,
    selected: false,
    selectedVerbs: []
  }
];

export function KubeconfigGenerator() {
  const [resources, setResources] = useState<Resource[]>(INITIAL_RESOURCES);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [namespace, setNamespace] = useState<string>('default');
  const [name, setName] = useState<string>('');
  const [kubeconfig, setKubeconfig] = useState<string | null>(null);
  const { namespaces, isLoading: namespacesLoading, error: namespacesError } = useNamespaces();

  const toggleExpand = (index: number) => {
    setResources(resources.map((resource, i) => ({
      ...resource,
      isExpanded: i === index ? !resource.isExpanded : resource.isExpanded
    })));
  };

  const toggleResourceSelection = (index: number) => {
    setResources(resources.map((resource, i) => ({
      ...resource,
      selected: i === index ? !resource.selected : resource.selected,
      selectedVerbs: i === index && !resource.selected ? [] : resource.selectedVerbs
    })));
  };

  const toggleVerb = (resourceIndex: number, verb: string) => {
    setResources(resources.map((resource, i) => {
      if (i !== resourceIndex) return resource;
      
      const newSelectedVerbs = resource.selectedVerbs.includes(verb)
        ? resource.selectedVerbs.filter(v => v !== verb)
        : [...resource.selectedVerbs, verb];
      
      return {
        ...resource,
        selectedVerbs: newSelectedVerbs
      };
    }));
  };

  const selectAllResources = (selected: boolean) => {
    setResources(resources.map(resource => ({
      ...resource,
      selected,
      selectedVerbs: selected ? [...resource.verbs] : []
    })));
  };

  const selectAllVerbs = (resourceIndex: number, selected: boolean) => {
    setResources(resources.map((resource, i) => {
      if (i !== resourceIndex) return resource;
      return {
        ...resource,
        selectedVerbs: selected ? [...resource.verbs] : []
      };
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess(false);
    setError(null);
    setKubeconfig(null);

    if (!name.trim()) {
      setError('Please enter a name');
      return;
    }

    const selectedResources = resources.filter(r => r.selected);
    if (selectedResources.length === 0) {
      setError('Please select at least one resource');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/generate-kubeconfig`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          namespace,
          resources: selectedResources.map(r => r.name),
          verbs: Array.from(new Set(selectedResources.flatMap(r => r.selectedVerbs)))
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate kubeconfig');
      }

      const data = await response.json();
      setSuccess(true);
      setKubeconfig(data.kubeconfig);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const handleDownload = () => {
    if (!kubeconfig) return;
    
    const blob = new Blob([kubeconfig], { type: 'text/yaml' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kubeconfig-${name}.yaml`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const areAllResourcesSelected = resources.every(r => r.selected);
  const areAnyResourcesSelected = resources.some(r => r.selected);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
            <div className="flex items-center justify-between">
              <button
                onClick={() => window.location.reload()}
                className="text-white hover:text-blue-100 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
              <h1 className="text-2xl font-bold text-white text-center flex-1">Kubeconfig Generator</h1>
              <div className="w-6"></div> {/* Spacer for alignment */}
            </div>
          </div>
          
          <div className="p-6">
            {error && (
              <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6 rounded-r">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {success && (
              <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-6 rounded-r">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-green-700">Kubeconfig generated successfully!</p>
                  </div>
                </div>
              </div>
            )}

            <div className="mb-6">
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Service Account Name
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter name for ServiceAccount"
                className="block w-full px-3 py-2 rounded-md border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>

            <div className="mb-6">
              <label htmlFor="namespace" className="block text-sm font-medium text-gray-700 mb-1">
                Namespace
              </label>
              {namespacesError ? (
                <div className="text-sm text-red-600 mb-2">
                  Failed to load namespaces: {namespacesError}
                </div>
              ) : (
                <select
                  id="namespace"
                  value={namespace}
                  onChange={(e) => setNamespace(e.target.value)}
                  disabled={namespacesLoading}
                  className="block w-full px-3 py-2 rounded-md border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  {namespacesLoading ? (
                    <option>Loading namespaces...</option>
                  ) : (
                    namespaces.map(ns => (
                      <option key={ns} value={ns}>{ns}</option>
                    ))
                  )}
                </select>
              )}
            </div>

            <div className="flex items-center justify-between mb-4 px-4 py-2 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">Resources</span>
              <button
                type="button"
                onClick={() => selectAllResources(!areAllResourcesSelected)}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                {areAllResourcesSelected ? 'Deselect All' : 'Select All'}
              </button>
            </div>

            <div className="space-y-2">
              {resources.map((resource, index) => (
                <div key={index} className="border rounded-lg overflow-hidden bg-white shadow-sm">
                  <div 
                    className="flex items-center justify-between p-4 hover:bg-gray-50 cursor-pointer"
                    onClick={() => toggleExpand(index)}
                  >
                    <div className="flex items-center space-x-4">
                      <input
                        type="checkbox"
                        checked={resource.selected}
                        onChange={(e) => {
                          e.stopPropagation();
                          toggleResourceSelection(index);
                        }}
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
                      />
                      <div>
                        <span className="font-medium text-gray-900">{resource.name}</span>
                        {resource.apiGroup && (
                          <span className="ml-2 text-sm text-gray-500">({resource.apiGroup})</span>
                        )}
                      </div>
                    </div>
                    <span className="text-gray-400">
                      {resource.isExpanded ? '▼' : '▶'}
                    </span>
                  </div>
                  
                  {resource.isExpanded && (
                    <div className="p-4 border-t bg-gray-50">
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-sm text-gray-600">Permissions</span>
                        <button
                          type="button"
                          onClick={() => selectAllVerbs(index, !resource.verbs.every(v => resource.selectedVerbs.includes(v)))}
                          className="text-sm text-blue-600 hover:text-blue-800"
                        >
                          {resource.verbs.every(v => resource.selectedVerbs.includes(v)) ? 'Deselect All' : 'Select All'}
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {resource.verbs.map(verb => (
                          <label
                            key={verb}
                            className={`inline-flex items-center px-3 py-1 rounded-full cursor-pointer transition-colors
                              ${resource.selectedVerbs.includes(verb)
                                ? 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                          >
                            <input
                              type="checkbox"
                              checked={resource.selectedVerbs.includes(verb)}
                              onChange={() => toggleVerb(index, verb)}
                              className="hidden"
                            />
                            {verb}
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="flex gap-4 mt-6">
              <button
                onClick={handleSubmit}
                disabled={!areAnyResourcesSelected || !name}
                className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors
                  ${!areAnyResourcesSelected || !name
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 shadow-md hover:shadow-lg'}`}
              >
                Generate Kubeconfig
              </button>

              {kubeconfig && (
                <button
                  onClick={handleDownload}
                  className="flex-1 py-3 px-4 rounded-lg font-medium border-2 border-blue-600 text-blue-600 hover:bg-blue-50 transition-colors"
                >
                  Download Kubeconfig
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}