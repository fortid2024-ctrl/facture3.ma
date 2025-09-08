import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useData } from '../../contexts/DataContext';
import StatsCards from './StatsCards';
import RecentInvoices from './RecentInvoices';
import TopProducts from './TopProducts';

export default function Dashboard() {
  const { user, checkSubscriptionExpiry } = useAuth();
  const { t } = useLanguage();
  const { invoices, clients, products } = useData();

  // Vérifier l'expiration à l'ouverture du dashboard
  React.useEffect(() => {
    if (user) {
      checkSubscriptionExpiry();
    }
  }, [user, checkSubscriptionExpiry]);

  const hasAnyData = invoices.length > 0 || clients.length > 0 || products.length > 0;

  // Message de bienvenue personnalisé
  const getWelcomeMessage = () => {
    if (user?.isAdmin) {
      return `Bienvenue ${user.name} ! Vous êtes connecté en tant qu'administrateur.`;
    } else {
      const permissionCount = user?.permissions ? Object.values(user.permissions).filter(Boolean).length : 0;
      return `Bienvenue ${user?.name} ! Vous avez accès à ${permissionCount} section${permissionCount > 1 ? 's' : ''} de ${user?.company?.name}.`;
    }
  };
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">{t('dashboard')}</h1>
        <div className="text-sm text-gray-500">
          Dernière mise à jour: {new Date().toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </div>
      </div>

      {/* Message de bienvenue personnalisé */}
      <div className={`rounded-xl border p-4 ${
        user?.isAdmin 
          ? 'bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200' 
          : 'bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200'
      }`}>
        <p className={`text-sm font-medium ${
          user?.isAdmin ? 'text-indigo-800' : 'text-blue-800'
        }`}>
          {getWelcomeMessage()}
        </p>
      </div>
      <StatsCards />

      {!hasAnyData && (
        <div className="bg-gradient-to-br from-teal-50 to-blue-50 rounded-xl border border-teal-200 p-8 text-center">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 bg-gradient-to-br from-teal-600 to-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🚀</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Bienvenue sur Facture.ma !</h3>
            <p className="text-gray-600 mb-4">
              Commencez par ajouter vos premiers clients et produits pour voir vos données apparaître ici.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors">
                Ajouter un client
              </button>
              <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
                Ajouter un produit
              </button>
            </div>
          </div>
        </div>
      )}

      <TopProducts />

      <RecentInvoices />
    </div>
  );
}