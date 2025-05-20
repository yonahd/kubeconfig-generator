import { GeneratorSelector } from './components/GeneratorSelector';
import './index.css';

function App() {
  return (
    <div className="min-h-screen bg-gray-50 relative">
      {/* Background pattern */}
      <div 
        className="absolute inset-0 opacity-50"
        style={{
          backgroundImage: `
            linear-gradient(to right, #e5e7eb 1px, transparent 1px),
            linear-gradient(to bottom, #e5e7eb 1px, transparent 1px)
          `,
          backgroundSize: '24px 24px'
        }}
      />
      
      {/* Content */}
      <div className="relative">
        <GeneratorSelector />
      </div>
    </div>
  );
}

export default App;