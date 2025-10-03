import React, { useState } from 'react';
import { MenuIcon } from './icons/MenuIcon';
import { XIcon } from './icons/XIcon';

type Page = 'home' | 'gallery' | 'contact';

interface HeaderProps {
  onNavClick: (page: Page) => void;
}

const Header: React.FC<HeaderProps> = ({ onNavClick }) => {
  const [isOpen, setIsOpen] = useState(false);

  const navLinks: { name: string; page: Page }[] = [
    { name: 'Home', page: 'home' },
    { name: 'Gallery', page: 'gallery' },
    { name: 'Contact', page: 'contact' },
  ];

  const handleLinkClick = (page: Page) => {
    onNavClick(page);
    setIsOpen(false);
  };

  const headerClasses = `sticky top-0 z-50 bg-white shadow-md`;
  const textColorClass = 'text-gray-800';
  const linkColorClass = 'text-gray-700 hover:text-blue-600';


  return (
    <header className={headerClasses}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <button onClick={() => handleLinkClick('home')} className="flex items-center space-x-2 focus:outline-none">
            <svg className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
            <span className={`text-2xl font-bold ${textColorClass}`}>Adventure Today</span>
          </button>

          <nav className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <button
                key={link.name}
                onClick={() => handleLinkClick(link.page)}
                className={`font-medium text-lg transition-colors ${linkColorClass}`}
              >
                {link.name}
              </button>
            ))}
          </nav>

          <div className={`md:hidden ${textColorClass}`}>
            <button onClick={() => setIsOpen(!isOpen)} aria-label="Toggle menu" className="focus:outline-none">
              {isOpen ? <XIcon /> : <MenuIcon />}
            </button>
          </div>
        </div>
      </div>
      
      {isOpen && (
        <div className="md:hidden bg-white pb-4 animate-fade-in-down">
          <nav className="flex flex-col items-center space-y-4">
            {navLinks.map((link) => (
              <button
                key={link.name}
                onClick={() => handleLinkClick(link.page)}
                className="font-medium text-lg text-gray-700 hover:text-blue-600"
              >
                {link.name}
              </button>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;