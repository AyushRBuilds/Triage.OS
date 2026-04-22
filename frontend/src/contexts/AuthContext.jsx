import { createContext, useContext, useState, useEffect } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Fetch user role and other data from Firestore
        const docRef = doc(db, "users", firebaseUser.uid);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const userData = {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            ...docSnap.data()
          };
          setUser(userData);
          localStorage.setItem('triage_user', JSON.stringify(userData));
        } else {
          // If Firestore data doesn't exist, just use basic info
          const userData = {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            role: 'nurse' // Default role if not found
          };
          setUser(userData);
        }
      } else {
        setUser(null);
        localStorage.removeItem('triage_user');
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = async (email, password) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      // Data will be fetched in onAuthStateChanged
      return { success: true, user: userCredential.user };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const signup = async (email, password, role, name) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      
      // Store additional data in Firestore
      const initials = name.split(' ').map(n => n[0]).join('').toUpperCase();
      const userData = {
        name,
        role,
        initials,
        email,
        ward: role === 'admin' ? 'Hospital Admin' : 'ICU Ward 3'
      };
      
      await setDoc(doc(db, "users", firebaseUser.uid), userData);
      
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout error", error);
    }
  };

  const isAuthenticated = !!user;

  const updateUser = async (updatedData) => {
    if (!user) return;
    try {
      await setDoc(doc(db, "users", user.uid), updatedData, { merge: true });
      setUser({ ...user, ...updatedData });
    } catch (error) {
      console.error("Update user error", error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, isAuthenticated, updateUser, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}

export default AuthContext;
