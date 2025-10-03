import React from 'react';
import { MegaphoneIcon } from './icons/MegaphoneIcon';

interface TickerProps {
  text: string;
}

const Ticker: React.FC<TickerProps> = ({ text }) => {
  return (
    <div className="bg-white border-b border-t border-gray-200 w-full overflow-hidden ticker-container">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center h-12">
          <div className="flex-shrink-0 pr-4">
             <span className="flex items-center space-x-2 text-sm font-semibold text-blue-600">
                <MegaphoneIcon />
                <span>Infos</span>
             </span>
          </div>
          <div className="flex-1 relative overflow-hidden h-full">
            <div className="absolute inset-0 flex items-center">
              <p className="whitespace-nowrap animate-scroll-horizontal text-gray-700 absolute">
                {text}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Ticker;