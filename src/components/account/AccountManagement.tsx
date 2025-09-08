import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useUserManagement, UserPermissions } from '../../contexts/UserManagementContext';
import AddUserModal from './AddUserModal';
import EditUserModal from './EditUserModal';
import { 
  Users, 
  Crown, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Shield, 
  Key, 
  Eye,
  CheckCircle,
  XCircle,
  Settings,
  UserCheck,
  Clock,
  AlertTriangle
} from 'lucide-react';

export default function AccountManagement() {
  const { user } = useAuth();
  const { 
    managedUsers, 
    deleteUser, 
    resetUserPassword, 
    canCreateUser, 
    remainingUserSlots 
  } = useUserManagement();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [showResetModal, setShowResetModal] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');

  // Vérifier l'accès PRO
  const isProActive = user?.company.subscription === 'pro' && user?.company.expiryDate && 
    new Date(user.company.expiryDate) > new Date();

  if (!isProActive) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <Crown className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            🔒 Fonctionnalité PRO
          </h2>
          <p className="text-gray-600 mb-6">
            La Gestion de Compte est réservée aux abonnés PRO. 
            Passez à la version PRO pour créer et gérer jusqu'à 5 comptes utilisateurs.
          </p>
          <button className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200">
            <span className="flex items-center justify-center space-x-2">
              <Crown className="w-5 h-5" />
              <span>Passer à PRO - 299 MAD/mois</span>
            </span>
          </button>
        </div>
      </div>
    );
  }

  const filteredUsers = managedUsers.filter(managedUser =>
    managedUser.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    managedUser.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDeleteUser = (id: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
      deleteUser(id);
      alert('Utilisateur supprimé avec succès !');
    }
  };

  const handleResetPassword = async (id: string) => {
    if (!newPassword || newPassword.length < 6) {
      alert('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    try {
      await resetUserPassword(id, newPassword);
      setShowResetModal(null);
      setNewPassword('');
      alert('Mot de passe réinitialisé avec succès !');
    } catch (error) {
      console.error('Erreur lors de la réinitialisation:', error);
      alert('Erreur lors de la réinitialisation du mot de passe');
    }
  };

  const getPermissionsCount = (permissions: UserPermissions) => {
    return Object.values(permissions).filter(Boolean).length;
  };

  const getPermissionsList = (permissions: UserPermissions) => {
    const permissionLabels = {
      dashboard: 'Tableau de bord',
      invoices: 'Factures',
      quotes: 'Devis',
      clients: 'Clients',
      products: 'Produits',
      suppliers: 'Fournisseurs',
      stockManagement: 'Gestion Stock',
      supplierManagement: 'Gestion Fournisseurs',
      hrManagement: 'Gestion RH',
      reports: 'Rapports',
      settings: 'Paramètres'
    };

    return Object.entries(permissions)
      .filter(([_, allowed]) => allowed)
      .map(([key, _]) => permissionLabels[key as keyof UserPermissions])
      .join(', ');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            Actif
          </span>
        );
      case 'inactive':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <XCircle className="w-3 h-3 mr-1" />
            Inactif
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
            <Users className="w-8 h-8 text-indigo-600" />
            <span>Gestion de Compte</span>
            <Crown className="w-6 h-6 text-yellow-500" />
          </h1>
          <p className="text-gray-600 mt-2">
            Créez et gérez jusqu'à 5 comptes utilisateurs avec des permissions personnalisées. 
            Fonctionnalité réservée aux abonnés PRO.
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="text-right">
            <p className="text-sm font-medium text-gray-900">
              {managedUsers.length}/5 utilisateurs créés
            </p>
            <p className="text-xs text-gray-500">
              {remainingUserSlots} emplacements restants
            </p>
          </div>
          <button 
            onClick={() => setIsAddModalOpen(true)}
            disabled={!canCreateUser}
            className="inline-flex items-center space-x-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-4 py-2 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="w-4 h-4" />
            <span>Nouvel Utilisateur</span>
          </button>
        </div>
      </div>

      {/* Alerte limite */}
      {!canCreateUser && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="w-6 h-6 text-amber-600" />
            <div>
              <h3 className="font-semibold text-amber-900">Limite atteinte</h3>
              <p className="text-amber-800 text-sm">
                Vous avez atteint la limite de 5 utilisateurs. Supprimez un utilisateur existant pour en créer un nouveau.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Compte Admin */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl shadow-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
              <Shield className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-xl font-bold">Compte Administrateur</h3>
              <p className="text-sm opacity-90">{user?.email}</p>
              <p className="text-xs opacity-75">Accès complet à toutes les fonctionnalités</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">Admin</div>
            <div className="text-sm opacity-90">Permissions complètes</div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            placeholder="Rechercher par nom ou email..."
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Utilisateurs Gérés</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Utilisateur
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email/Login
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Permissions
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Dernière Connexion
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((managedUser) => (
                <tr key={managedUser.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
                        <UserCheck className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">{managedUser.name}</div>
                        <div className="text-xs text-gray-500">
                          Créé le {new Date(managedUser.createdAt).toLocaleDateString('fr-FR')}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{managedUser.email}</div>
                    <div className="text-xs text-gray-500">Login: {managedUser.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {getPermissionsCount(managedUser.permissions)} section{getPermissionsCount(managedUser.permissions) > 1 ? 's' : ''}
                    </div>
                    <div className="text-xs text-gray-500 max-w-xs truncate" title={getPermissionsList(managedUser.permissions)}>
                      {getPermissionsList(managedUser.permissions)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(managedUser.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {managedUser.lastLogin ? (
                      <div>
                        <div>{new Date(managedUser.lastLogin).toLocaleDateString('fr-FR')}</div>
                        <div className="text-xs">{new Date(managedUser.lastLogin).toLocaleTimeString('fr-FR')}</div>
                      </div>
                    ) : (
                      <span className="text-gray-400">Jamais connecté</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => setEditingUser(managedUser.id)}
                        className="text-amber-600 hover:text-amber-700 transition-colors"
                        title="Modifier"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setShowResetModal(managedUser.id)}
                        className="text-blue-600 hover:text-blue-700 transition-colors"
                        title="Réinitialiser mot de passe"
                      >
                        <Key className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteUser(managedUser.id)}
                        className="text-red-600 hover:text-red-700 transition-colors"
                        title="Supprimer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredUsers.length === 0 && (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">
              {managedUsers.length === 0 ? 'Aucun utilisateur créé' : 'Aucun utilisateur trouvé'}
            </p>
            {managedUsers.length === 0 && (
              <p className="text-sm text-gray-400 mt-1">
                Créez votre premier utilisateur pour commencer
              </p>
            )}
          </div>
        )}
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{managedUsers.length}</p>
              <p className="text-sm text-gray-600">Utilisateurs Actifs</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {managedUsers.filter(u => u.status === 'active').length}
              </p>
              <p className="text-sm text-gray-600">Comptes Actifs</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{remainingUserSlots}</p>
              <p className="text-sm text-gray-600">Emplacements Restants</p>
            </div>
          </div>
        </div>
      </div>

      {/* Guide d'utilisation */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
          <Settings className="w-5 h-5 text-indigo-600" />
          <span>Guide d'Utilisation</span>
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">👤 Création d'Utilisateurs</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Créez jusqu'à 5 comptes utilisateurs</li>
                <li>• Définissez un nom, email et mot de passe</li>
                <li>• Choisissez les sections accessibles</li>
                <li>• Activez/désactivez les comptes à tout moment</li>
              </ul>
            </div>
            
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-medium text-green-900 mb-2">🔐 Gestion des Permissions</h4>
              <ul className="text-sm text-green-800 space-y-1">
                <li>• Contrôlez l'accès à chaque section</li>
                <li>• Modifiez les permissions à tout moment</li>
                <li>• Les utilisateurs voient uniquement leurs sections</li>
                <li>• Tableau de bord filtré selon les permissions</li>
              </ul>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <h4 className="font-medium text-purple-900 mb-2">🔑 Sécurité</h4>
              <ul className="text-sm text-purple-800 space-y-1">
                <li>• Réinitialisez les mots de passe</li>
                <li>• Surveillez les dernières connexions</li>
                <li>• Désactivez temporairement un compte</li>
                <li>• Supprimez définitivement un utilisateur</li>
              </ul>
            </div>
            
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <h4 className="font-medium text-orange-900 mb-2">📊 Cas d'Usage</h4>
              <ul className="text-sm text-orange-800 space-y-1">
                <li>• Employé factures : accès Factures + Clients</li>
                <li>• Gestionnaire stock : accès Produits + Stock</li>
                <li>• Comptable : accès Rapports + Factures</li>
                <li>• Commercial : accès Devis + Clients</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <AddUserModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
      />

      {editingUser && (
        <EditUserModal
          isOpen={!!editingUser}
          onClose={() => setEditingUser(null)}
          user={managedUsers.find(u => u.id === editingUser)!}
        />
      )}

      {/* Modal Reset Password */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-500 bg-opacity-75">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20">
            <div className="inline-block w-full max-w-md my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">Réinitialiser le mot de passe</h3>
                    <p className="text-sm opacity-90">
                      {managedUsers.find(u => u.id === showResetModal)?.name}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setShowResetModal(null);
                      setNewPassword('');
                    }}
                    className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                  >
                    <XCircle className="w-5 h-5" />
                  </button>
                </div>
              </div>
              
              <div className="p-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nouveau mot de passe
                    </label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Minimum 6 caractères"
                      minLength={6}
                    />
                  </div>
                  
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                    <p className="text-sm text-amber-800">
                      ⚠️ L'utilisateur devra utiliser ce nouveau mot de passe pour se connecter.
                    </p>
                  </div>
                </div>

                <div className="flex space-x-3 mt-6">
                  <button
                    onClick={() => {
                      setShowResetModal(null);
                      setNewPassword('');
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={() => handleResetPassword(showResetModal)}
                    disabled={!newPassword || newPassword.length < 6}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 disabled:opacity-50"
                  >
                    Réinitialiser
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}