import React, { useState } from 'react';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { Link, useNavigate } from 'react-router-dom';
import PotatoBackground from '../../components/common/PotatoBackground';
import { useAuth } from '../../context/AuthContext';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    setLoading(true);
    try {
      const res = await login(formData.email, formData.password);
      if (res?.success) {
        navigate('/dashboard', { replace: true });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setLoading(true);
    try {
      const res = await login('demo@cyberguard.com', 'demo123');
      if (res?.success) {
        navigate('/dashboard', { replace: true });
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#F3C98B',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <PotatoBackground />
        <div style={{
          padding: '2rem',
          backgroundColor: 'rgba(139, 69, 19, 0.9)',
          borderRadius: '68% 32% 74% 26% / 41% 56% 44% 59%',
          color: '#FFF8DC',
          textAlign: 'center',
          fontSize: '1.2rem',
          fontWeight: 'bold'
        }}>
          🔐 Signing you in... Please wait!
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#F3C98B',
      padding: '1rem',
      position: 'relative',
      overflow: 'hidden',
      fontFamily: '"Arial", sans-serif',
    }}>
      <PotatoBackground />
      <style>
        {`
          @keyframes slideUp {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          
          .input-field {
            width: 100%;
            padding: 12px 20px;
            border-radius: 25px;
            border: none;
            background-color: #FFF8DC;
            font-size: 1rem;
            outline: none;
            transition: all 0.3s ease;
            box-sizing: border-box;
          }
          
          .input-field:focus {
            box-shadow: 0 0 0 2px #8B4513;
            transform: scale(1.02);
          }
          
          .input-container {
            position: relative;
            margin-bottom: 1.5rem;
          }
          
          .input-label {
            color: #FFF8DC;
            font-weight: bold;
            margin-bottom: 0.5rem;
            display: block;
            margin-left: 0.5rem;
            font-size: 0.9rem;
          }
          
          .password-toggle {
            position: absolute;
            right: 15px;
            top: 50%;
            transform: translateY(-50%);
            background: none;
            border: none;
            color: #8B4513;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 4px;
          }
          
          .smash-button {
            width: 100%;
            padding: 1rem 2rem;
            border-radius: 25px;
            border: none;
            background-color: #FFF8DC;
            color: #8B4513;
            font-weight: bold;
            font-size: 1.1rem;
            cursor: pointer;
            transition: all 0.3s ease;
            box-shadow: 0 8px 16px rgba(0,0,0,0.2);
            margin-bottom: 1.5rem;
          }
          
          .smash-button:hover:not(:disabled) {
            background-color: #F5E6D3;
            transform: translateY(-2px);
            box-shadow: 0 12px 20px rgba(0,0,0,0.3);
          }
          
          .smash-button:disabled {
            background-color: #DDD;
            color: #999;
            cursor: not-allowed;
            transform: none;
          }
          
          .demo-alert {
            background-color: rgba(255, 248, 220, 0.9);
            color: #8B4513;
            border-radius: 15px;
            padding: 1rem;
            margin-bottom: 1rem;
            text-align: center;
          }
          
          .demo-button {
            background: none;
            border: none;
            color: #8B4513;
            font-weight: bold;
            cursor: pointer;
            text-decoration: underline;
            margin-top: 0.5rem;
          }
          
          .error-text {
            color: #ff6b6b;
            font-size: 0.8rem;
            margin-top: 0.25rem;
            margin-left: 0.5rem;
          }
          
          .link-text {
            color: #FFF8DC;
            text-decoration: none;
          }
          
          .link-text:hover {
            text-decoration: underline;
          }
          
          .checkbox-container {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 1rem;
            color: #FFF8DC;
            font-size: 0.9rem;
          }
          
          .checkbox-wrapper {
            display: flex;
            align-items: center;
            gap: 0.5rem;
          }
        `}
      </style>

      {/* Potato-shaped container with irregular, bumpy edges */}
      <div style={{
        width: 'min(96vw, 460px)',
        maxWidth: '460px',
        background: '#b8742a',
        // More irregular potato-like border-radius with uneven bumps
        borderRadius: '68% 32% 74% 26% / 41% 56% 44% 59%',
        boxShadow: '12px 12px 0 rgba(0,0,0,0.25)',
        // Increased padding to ensure content doesn't get clipped by irregular edges
        padding: '100px 60px 70px 60px',
        marginTop: '14px',
        position: 'relative',
        zIndex: 10,
        animation: 'slideUp 0.5s ease-out',
        overflow: 'hidden',
        // Add subtle texture variations to make it look more potato-like
        background: 'linear-gradient(135deg, #b8742a 0%, #a66a25 30%, #c17f2f 70%, #b8742a 100%)',
      }}>
        {/* Add some subtle "potato eyes" or indentations */}
        <div style={{
          position: 'absolute',
          top: '25px',
          right: '40px',
          width: '8px',
          height: '12px',
          background: 'rgba(139, 69, 19, 0.3)',
          borderRadius: '50% 70% 40% 60%',
          transform: 'rotate(-15deg)',
        }}></div>
        
        <div style={{
          position: 'absolute',
          top: '45px',
          left: '35px',
          width: '6px',
          height: '10px',
          background: 'rgba(139, 69, 19, 0.2)',
          borderRadius: '60% 40% 70% 30%',
          transform: 'rotate(25deg)',
        }}></div>
        
        <div style={{
          position: 'absolute',
          bottom: '40px',
          right: '50px',
          width: '7px',
          height: '9px',
          background: 'rgba(139, 69, 19, 0.25)',
          borderRadius: '40% 60% 50% 50%',
          transform: 'rotate(45deg)',
        }}></div>

        <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <h1 style={{
            color: '#FFF8DC',
            fontSize: '2rem',
            fontFamily: '"Arial Black", sans-serif',
            letterSpacing: '2px',
            textShadow: '2px 2px 4px rgba(0,0,0,0.3)',
            margin: '0 0 0.5rem 0',
            lineHeight: '1',
          }}>
            CYBERGUARD PRO
          </h1>
        </div>

        <div>
          <div className="input-container">
            <label className="input-label">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="input-field"
              placeholder=""
              autoComplete="email"
            />
            {errors.email && <div className="error-text">{errors.email}</div>}
          </div>

          <div className="input-container">
            <label className="input-label">Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="input-field"
                style={{ paddingRight: '50px' }}
                placeholder=""
                autoComplete="current-password"
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
              </button>
            </div>
            {errors.password && <div className="error-text">{errors.password}</div>}
          </div>

          <button
            type="button"
            className="smash-button"
            disabled={loading}
            onClick={handleSubmit}
          >
            {loading ? 'Smashing…' : 'Smash In'}
          </button>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.25rem' }}>
            <button 
              className="demo-button" 
              onClick={handleDemoLogin}
              disabled={loading}
              aria-label="Demo login"
              style={{ fontSize: '0.85rem' }}
            >
              Demo
            </button>
            <Link to="/forgot-password" className="link-text">Forgot password?</Link>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            margin: '1rem 0',
            color: '#FFF8DC',
          }}>
            <div style={{
              flex: 1,
              height: '1px',
              background: 'rgba(255, 248, 220, 0.3)',
            }}></div>
            <span style={{ padding: '0 1rem', fontSize: '0.9rem' }}>or</span>
            <div style={{
              flex: 1,
              height: '1px',
              background: 'rgba(255, 248, 220, 0.3)',
            }}></div>
          </div>

          <div style={{ textAlign: 'center', color: '#FFF8DC', fontSize: '0.9rem' }}>
            Don't have an account?{' '}
            <Link to="/register" className="link-text" style={{ fontWeight: 'bold' }}>
              Sign up
            </Link>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
};

export default Login;