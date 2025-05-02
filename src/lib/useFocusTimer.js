import { useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase';

const useFocusTimer = ({ onLeave, onReturn, onUnload, onReLogin }) => {

    // leave, return
    useEffect(() => {
        const handleVisibilityChange = () => {
          if (document.visibilityState === 'hidden') {
            onLeave?.();
          } else if (document.visibilityState === 'visible') {
            onReturn?.();
          }
        };
    
        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => {
          document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
      }, [onLeave, onReturn]);
    
      // unload
      useEffect(() => {
        const handleBeforeUnload = () => {
          onUnload?.();
        };
    
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => {
          window.removeEventListener('beforeunload', handleBeforeUnload);
        };
      }, [onUnload]);
    
      // relogin
      useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
          if (user) {
            onReLogin?.(user);
          }
        });
    
        return () => unsubscribe();
      }, [onReLogin]);

};
export default useFocusTimer;