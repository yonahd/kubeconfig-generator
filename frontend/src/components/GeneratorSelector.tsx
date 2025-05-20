import { useState } from 'react';
import { RoleGenerator } from './RoleGenerator';
import { KubeconfigGenerator } from './KubeconfigGenerator';

type GeneratorType = 'role' | 'kubeconfig' | null;

export function GeneratorSelector() {
  const [selectedGenerator, setSelectedGenerator] = useState<GeneratorType>(null);

  if (selectedGenerator === null) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
              <h1 className="text-2xl font-bold text-white text-center">Kubernetes Access Manager</h1>
            </div>
            
            <div className="p-6">
              <div className="text-center mb-8">
                <h2 className="text-xl font-semibold text-gray-800 mb-2">What would you like to generate?</h2>
                <p className="text-gray-600">Choose between creating a Role or generating a Kubeconfig file</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <button
                  onClick={() => setSelectedGenerator('role')}
                  className="p-6 rounded-lg border-2 border-blue-200 hover:border-blue-400 transition-colors bg-white hover:bg-blue-50"
                >
                  <div className="text-center">
                    <div className="mb-4">
                      <svg className="w-12 h-12 mx-auto text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Role Generator</h3>
                    <p className="text-gray-600">Create Kubernetes RBAC roles with fine-grained permissions</p>
                  </div>
                </button>

                <button
                  onClick={() => setSelectedGenerator('kubeconfig')}
                  className="p-6 rounded-lg border-2 border-blue-200 hover:border-blue-400 transition-colors bg-white hover:bg-blue-50"
                >
                  <div className="text-center">
                    <div className="mb-4">
                      <svg className="w-12 h-12 mx-auto text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Kubeconfig Generator</h3>
                    <p className="text-gray-600">Generate kubeconfig files for service accounts with specific permissions</p>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {selectedGenerator === 'role' && <RoleGenerator />}
      {selectedGenerator === 'kubeconfig' && <KubeconfigGenerator />}
    </div>
  );
} 