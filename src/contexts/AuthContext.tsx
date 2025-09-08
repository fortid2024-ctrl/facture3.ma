import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  User as FirebaseUser,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, query, collection, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { ManagedUser } from './UserManagementContext';

interface Company {
  name: string;
  ice: string;
  if: string;
  rc: string;
  cnss: string;
  address: string;
  phone: string;
  email: string;
  patente: string;
  website: string;
  logo?: string;
  signature?: string;
  invoiceNumberingFormat?: string;
  invoicePrefix?: string;
  invoiceCounter?: number;
  lastInvoiceYear?: number;
  defaultTemplate?: string;
  subscription?: 'free' | 'pro';
  subscriptionDate?: string;
  expiryDate?: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
  isAdmin: boolean;
  managedUserId?: string; // ID de l'utilisateur géré (si applicable)
  permissions?: {
    dashboard: boolean;
    invoices: boolean;
    quotes: boolean;
    clients: boolean;
    products: boolean;
    suppliers: boolean;
    stockManagement: boolean;
    supplierManagement: boolean;
    hrManagement: boolean;
    reports: boolean;
    settings: boolean;
  };
  company: Company;
}

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string, companyData: Company) => Promise<boolean>;
  logout: () => Promise<void>;
  upgradeSubscription: () => Promise<void>;
  updateCompanySettings: (settings: Partial<Company>) => Promise<void>;
  checkSubscriptionExpiry: () => Promise<void>;
  isLoading: boolean;
  showExpiryAlert: boolean;
  setShowExpiryAlert: (show: boolean) => void;
  expiredDate: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showExpiryAlert, setShowExpiryAlert] = useState(false);
  const [expiredDate, setExpiredDate] = useState<string | null>(null);

  // Fonction pour vérifier si un utilisateur géré existe
  const checkManagedUser = async (email: string, password: string): Promise<ManagedUser | null> => {
    try {
      const managedUsersQuery = query(
        collection(db, 'managedUsers'),
        where('email', '==', email),
        where('password', '==', password),
        where('status', '==', 'active')
      );
      
      const snapshot = await getDocs(managedUsersQuery);
      if (!snapshot.empty) {
        const userData = snapshot.docs[0].data() as ManagedUser;
        return {
          id: snapshot.docs[0].id,
          ...userData
        };
      }
      return null;
    } catch (error) {
      console.error('Erreur lors de la vérification de l\'utilisateur géré:', error);
      return null;
    }
  };

  const checkSubscriptionExpiry = async (userId: string, userData: any) => {
    if (userData.subscription === 'pro' && userData.expiryDate) {
      const currentDate = new Date();
      const expiryDate = new Date(userData.expiryDate);
      
      if (currentDate > expiryDate) {
        // L'abonnement a expiré, repasser en version gratuite
        try {
          await updateDoc(doc(db, 'entreprises', userId), {
            subscription: 'free',
            subscriptionDate: new Date().toISOString(),
            expiryDate: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
          
          // Mettre à jour l'état local
          setUser(prevUser => {
            if (prevUser) {
              return {
                ...prevUser,
                company: {
                  ...prevUser.company,
                  subscription: 'free',
                  subscriptionDate: new Date().toISOString(),
                  expiryDate: new Date().toISOString()
                }
              };
            }
            return prevUser;
          });
          
          // Préparer l'alerte d'expiration
          setExpiredDate(userData.expiryDate);
          setShowExpiryAlert(true);
          
        } catch (error) {
          console.error('Erreur lors de la mise à jour de l\'expiration:', error);
        }
      }
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setFirebaseUser(firebaseUser);
        // Récupérer les données utilisateur depuis Firestore
        try {
          const userDoc = await getDoc(doc(db, 'entreprises', firebaseUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setUser({
              id: firebaseUser.uid,
              name: userData.ownerName || firebaseUser.email?.split('@')[0] || 'Utilisateur',
              email: firebaseUser.email || '',
              role: 'admin',
              isAdmin: true,
              company: {
                name: userData.name,
                ice: userData.ice,
                if: userData.if,
                rc: userData.rc,
                cnss: userData.cnss,
                address: userData.address,
                phone: userData.phone,
                logo: userData.logo,
                email: userData.email,
                signature: userData.signature || "",
                patente: userData.patente,
                website: userData.website,
                invoiceNumberingFormat: userData.invoiceNumberingFormat,
                invoicePrefix: userData.invoicePrefix,
                invoiceCounter: userData.invoiceCounter,
                lastInvoiceYear: userData.lastInvoiceYear,
                defaultTemplate: userData.defaultTemplate || 'template1',
                subscription: userData.subscription || 'free',
                subscriptionDate: userData.subscriptionDate,
                expiryDate: userData.expiryDate
              }
            });
            
            // Vérifier l'expiration de l'abonnement à chaque connexion
            await checkSubscriptionExpiry(firebaseUser.uid, userData);
          }
        } catch (error) {
          console.error('Erreur lors de la récupération des données utilisateur:', error);
        }
      } else {
        setFirebaseUser(null);
        setUser(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      // D'abord, vérifier si c'est un utilisateur géré
      const managedUser = await checkManagedUser(email, password);
      
      if (managedUser) {
        // C'est un utilisateur géré, récupérer les données de l'entreprise
        const companyDoc = await getDoc(doc(db, 'entreprises', managedUser.entrepriseId));
        if (companyDoc.exists()) {
          const companyData = companyDoc.data();
          
          // Mettre à jour la dernière connexion
          await updateDoc(doc(db, 'managedUsers', managedUser.id), {
            lastLogin: new Date().toISOString()
          });
          
          // Créer l'objet utilisateur avec les permissions
          setUser({
            id: managedUser.entrepriseId, // Utiliser l'ID de l'entreprise pour l'accès aux données
            name: managedUser.name,
            email: managedUser.email,
            role: 'user',
            isAdmin: false,
            permissions: managedUser.permissions,
            managedUserId: managedUser.id, // Garder l'ID de l'utilisateur géré pour les opérations spécifiques
            company: {
              name: companyData.name,
              ice: companyData.ice,
              if: companyData.if,
              rc: companyData.rc,
              cnss: companyData.cnss,
              address: companyData.address,
              phone: companyData.phone,
              logo: companyData.logo,
              email: companyData.email,
              signature: companyData.signature || "",
              patente: companyData.patente,
              website: companyData.website,
              invoiceNumberingFormat: companyData.invoiceNumberingFormat,
              invoicePrefix: companyData.invoicePrefix,
              invoiceCounter: companyData.invoiceCounter,
              lastInvoiceYear: companyData.lastInvoiceYear,
              defaultTemplate: companyData.defaultTemplate || 'template1',
              subscription: companyData.subscription || 'free',
              subscriptionDate: companyData.subscriptionDate,
              expiryDate: companyData.expiryDate
            }
          });
          
          return true;
        }
        return false;
      }

      // Sinon, essayer la connexion Firebase normale (admin)
      await signInWithEmailAndPassword(auth, email, password);
      return true;
    } catch (error) {
      console.error('Erreur de connexion:', error);
      return false;
    }
  };

  const register = async (email: string, password: string, companyData: Company): Promise<boolean> => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const userId = userCredential.user.uid;

      // Sauvegarder les données de l'entreprise dans Firestore
      await setDoc(doc(db, 'entreprises', userId), {
        ...companyData,
        ownerEmail: email,
        ownerName: email.split('@')[0],
        subscription: 'free',
        subscriptionDate: new Date().toISOString(),
        expiryDate: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      return true;
    } catch (error) {
      console.error('Erreur lors de l\'inscription:', error);
      return false;
    }
  };

  const upgradeSubscription = async (): Promise<void> => {
    if (!user) return;
    
    try {
      const currentDate = new Date();
      const expiryDate = new Date();
      expiryDate.setDate(currentDate.getDate() + 30); // 30 jours à partir d'aujourd'hui
      
      await updateDoc(doc(db, 'entreprises', user.id), {
        subscription: 'pro',
        subscriptionDate: currentDate.toISOString(),
        expiryDate: expiryDate.toISOString(),
        updatedAt: new Date().toISOString()
      });
      
      // Mettre à jour l'état local
      setUser(prevUser => {
        if (prevUser) {
          return {
            ...prevUser,
            company: {
              ...prevUser.company,
              subscription: 'pro',
              subscriptionDate: currentDate.toISOString(),
              expiryDate: expiryDate.toISOString()
            }
          };
        }
        return prevUser;
      });
      
    } catch (error) {
      console.error('Erreur lors de la mise à niveau:', error);
      throw error;
    }
  };

  const updateCompanySettings = async (settings: Partial<Company>): Promise<void> => {
    if (!user) return;
    
    try {
      await updateDoc(doc(db, 'entreprises', user.id), {
        ...settings,
        updatedAt: new Date().toISOString()
      });
      
      // Mettre à jour l'état local immédiatement
      setUser(prevUser => {
        if (prevUser) {
          return {
            ...prevUser,
            company: {
              ...prevUser.company,
              ...settings
            }
          };
        }
        return prevUser;
      });
      
    } catch (error) {
      console.error('Erreur lors de la mise à jour des paramètres:', error);
      throw error;
    }
  };

  const checkSubscriptionExpiryManual = async (): Promise<void> => {
    if (!user) return;
    
    try {
      const userDoc = await getDoc(doc(db, 'entreprises', user.id));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        await checkSubscriptionExpiry(user.id, userData);
      }
    } catch (error) {
      console.error('Erreur lors de la vérification de l\'expiration:', error);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      // Si c'est un utilisateur géré, pas besoin de signOut Firebase
      if (user?.isAdmin) {
        await signOut(auth);
      } else {
        // Pour les utilisateurs gérés, simplement nettoyer l'état local
        setUser(null);
        setFirebaseUser(null);
      }
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    }
  };

  const value = {
    user,
    firebaseUser,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    upgradeSubscription,
    updateCompanySettings,
    checkSubscriptionExpiry: checkSubscriptionExpiryManual,
    isLoading,
    showExpiryAlert,
    setShowExpiryAlert,
    expiredDate,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
