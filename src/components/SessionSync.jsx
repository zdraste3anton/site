import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';


export default function SessionSync() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  useEffect(() => {
    const onUnauthorized = () => {
      logout();
      navigate('/login', { replace: true });
    };
    window.addEventListener('cf-unauthorized', onUnauthorized);
    return () => window.removeEventListener('cf-unauthorized', onUnauthorized);
  }, [logout, navigate]);

  return null;
}
