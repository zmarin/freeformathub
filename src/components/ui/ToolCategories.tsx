import React from 'react';
import { Icon } from './Icon';
import type { ToolCategory } from '../../types/tool';

export interface ToolCategoriesProps {
  categories: ToolCategory[];
}

export const ToolCategories: React.FC<ToolCategoriesProps> = ({ categories }) => {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {categories.map(category => (
        <a
          key={category.id}
          href={`/${category.id}`}
          
        >
          <div className="flex items-center mb-4">
            <div className={`w-12 h-12 bg-${category.color}-100${category.color}-900 rounded-lg flex items-center justify-center transition-transform`}>
              <Icon
                name={category.icon}
                className={`text-${category.color}-600${category.color}-400`}
                size={24}
              />
            </div>
            <div className="ml-4">
              <h3 className={`text-lg font-semibold text-gray-900 group-hover:text-${category.color}-600${category.color}-400`}>
                {category.name}
              </h3>
            </div>
          </div>
          <p >
            {category.description}
          </p>
        </a>
      ))}
    </div>
  );
};

export default ToolCategories;
