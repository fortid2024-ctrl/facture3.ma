import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { Bell, Search, User, LogOut, Globe, Menu } from 'lucide-react';

interface HeaderProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

export default function Header({ sidebarOpen, setSidebarOpen }: HeaderProps) {
  const { user, logout } = useAuth();
  const { language, setLanguage } = useLanguage();

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors lg:hidden"
          >
            <Menu className="w-5 h-5 text-gray-600" />
          </button>
          
        
        </div>

        <div className="flex items-center space-x-4">
          {/* Language Toggle */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setLanguage('fr')}
              className={`px-2 py-1 rounded text-sm font-medium transition-colors ${
                language === 'fr' 
                  ? 'bg-white text-teal-600 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              FR
            </button>
           
          </div>

          {/* Notifications */}
        

          {/* Company Name */}
          {user?.company?.name && (
            <div className="text-lg font-bold text-gray-900 uppercase">
              {user.company.name}
              {!user.isAdmin && (
                <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                  Utilisateur
                </span>
              )}
            </div>
          )}

          {/* User Menu */}
          <div className="flex items-center space-x-3">
            <div className="relative group">
              <button className="flex items-center space-x-2 p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
                {user?.company.logo ? (
                  <img 
                    src={user.company.logo} 
                    alt="Logo" 
                    className="w-8 h-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 bg-gradient-to-br from-teal-500 to-blue-500 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                )}
              </button>
              
              {/* Dropdown Menu */}
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                <div className="py-2">
                  {user && (
                    <div className="px-4 py-2 border-b border-gray-200">
                      <p className="text-sm font-medium text-gray-900">{user.name}</p>
                      <p className="text-xs text-gray-500">
                        {user.isAdmin ? 'Administrateur' : 'Utilisateur'}
                      </p>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={logout}
                    className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Déconnexion</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}