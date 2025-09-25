import React from 'react';
import { getToolComponent } from '../../lib/component-map';

interface ToolRendererProps {
  slug: string;
}

export function ToolRenderer({ slug }: ToolRendererProps) {
  const ToolComponent = getToolComponent(slug);
  
  if (!ToolComponent) {
    return (
      <div className="p-8 text-center">
        <div >
          <svg className="w-12 h-12 mx-auto mb-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
          </svg>
        </div>
        <h3 >
          Component Not Available
        </h3>
        <p >
          The {slug} tool component is not yet implemented in the component map.
        </p>
        <button 
          onClick={() => window.history.back()} 
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Go Back
        </button>
      </div>
    );
  }
  
  return <ToolComponent />;
}

export default ToolRenderer;