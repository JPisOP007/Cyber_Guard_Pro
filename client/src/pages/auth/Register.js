import React, { useState } from 'react';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import PotatoBackground from '../../components/common/PotatoBackground';

const Register = () => {
  const navigate = useNavigate();
  const { register: registerUser } = useAuth();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    company: '',
    jobTitle: '',
    agreeToTerms: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    const { name, value, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'agreeToTerms' ? checked : value,
    }));
    
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: '',
      }));
    }
  }

  function validateForm() {
    const newErrors = {};
    
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }
    
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }
    
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
    
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    if (!formData.agreeToTerms) {
      newErrors.agreeToTerms = 'You must agree to the terms and conditions';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit() {
    if (!validateForm()) return;
    setLoading(true);
    try {
      const payload = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
      };
      const res = await registerUser(payload);
      if (res?.success) {
        // After successful registration, go to login
        navigate('/login', { replace: true });
      }
    } finally {
      setLoading(false);
    }
  }

  // Background handled by shared PotatoBackground

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#F3C98B',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <PotatoBackground />
        <div style={{
          padding: '2rem',
          backgroundColor: 'rgba(139, 69, 19, 0.9)',
          borderRadius: '40px',
          color: '#FFF8DC',
          textAlign: 'center',
          fontSize: '1.2rem',
          fontWeight: 'bold'
        }}>
          🔐 Creating your account... Please wait!
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
          
          .input-field-half {
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
          
          .input-field:focus, .input-field-half:focus {
            box-shadow: 0 0 0 2px #8B4513;
            transform: scale(1.02);
          }
          
          .input-container {
            position: relative;
            margin-bottom: 1.5rem;
          }
          
          .input-container-half {
            position: relative;
            margin-bottom: 1.5rem;
          }
          
          .input-row {
            display: flex;
            gap: 1rem;
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
          
          .create-button {
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
          
          .create-button:hover:not(:disabled) {
            background-color: #F5E6D3;
            transform: translateY(-2px);
            box-shadow: 0 12px 20px rgba(0,0,0,0.3);
          }
          
          .create-button:disabled {
            background-color: #DDD;
            color: #999;
            cursor: not-allowed;
            transform: none;
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
            align-items: flex-start;
            gap: 0.5rem;
            margin-bottom: 1rem;
            color: #FFF8DC;
            font-size: 0.9rem;
          }
          
          .terms-text {
            line-height: 1.4;
          }
          
          .terms-link {
            color: #FFF8DC;
            text-decoration: underline;
            font-weight: bold;
          }
          
          .terms-link:hover {
            color: #F5E6D3;
          }
        `}
      </style>

      {/* Auth card as uneven potato-like blob */}
      <div style={{
        width: 'min(98vw, 560px)',
        maxWidth: '560px',
        background: '#b8742a',
        borderRadius: '56% 44% 58% 42% / 50% 50% 48% 52%',
        boxShadow: '12px 12px 0 rgba(0,0,0,0.25)',
        padding: '140px 54px 74px 54px',
        marginTop: '24px',
        position: 'relative',
        zIndex: 10,
        animation: 'slideUp 0.5s ease-out',
        overflow: 'hidden'
      }}>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <h1 style={{
              color: '#FFF8DC',
              fontSize: '2rem',
              fontFamily: '"Arial Black", sans-serif',
              letterSpacing: '2px',
              textShadow: '2px 2px 4px rgba(0,0,0,0.3)',
              margin: '0 0 0.5rem 0',
              lineHeight: '1',
            }}>
              JOIN CYBERGUARD PRO
            </h1>
            <div style={{
              color: '#FFF8DC',
              fontSize: '0.9rem',
              fontStyle: 'italic',
              marginBottom: '1rem',
              opacity: 0.8
            }}>
              by Potato Coders
            </div>
            <div style={{
              color: '#FFF8DC',
              fontSize: '1rem',
              fontWeight: 'normal'
            }}>
              Mash your account to get started
            </div>
          </div>

          <div>
            {/* Name Fields */}
            <div className="input-row">
              <div className="input-container-half" style={{ flex: 1 }}>
                <label className="input-label">First Name</label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  className="input-field-half"
                  placeholder=""
                  autoComplete="given-name"
                />
              </div>
              <div className="input-container-half" style={{ flex: 1 }}>
                <label className="input-label">Last Name</label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  className="input-field-half"
                  placeholder=""
                  autoComplete="family-name"
                />
              </div>
            </div>

            {/* Email Field */}
            <div className="input-container">
              <label className="input-label">Email Address</label>
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

            {/* Company/Job title removed for a cleaner form */}

            {/* Password Field */}
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
                  autoComplete="new-password"
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

            {/* Confirm Password Field */}
            <div className="input-container">
              <label className="input-label">Confirm Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="input-field"
                  style={{ paddingRight: '50px' }}
                  placeholder=""
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                >
                  {showConfirmPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                </button>
              </div>
              {errors.confirmPassword && <div className="error-text">{errors.confirmPassword}</div>}
            </div>

            {/* Terms and Conditions */}
            <div className="checkbox-container">
              <input
                type="checkbox"
                name="agreeToTerms"
                checked={formData.agreeToTerms}
                onChange={handleChange}
                style={{ 
                  accentColor: '#FFF8DC',
                  marginTop: '2px',
                  minWidth: '16px',
                  minHeight: '16px'
                }}
              />
              <div className="terms-text">
                I agree to the{' '}
                <Link to="/terms" className="terms-link">Terms of Service</Link>
                {' '}and{' '}
                <Link to="/privacy" className="terms-link">Privacy Policy</Link>
              </div>
            </div>
            {errors.agreeToTerms && <div className="error-text" style={{ marginLeft: '0' }}>{errors.agreeToTerms}</div>}

            {/* Submit Button */}
            <button
              type="button"
              className="create-button"
              disabled={loading}
              onClick={handleSubmit}
            >
              {loading ? 'Cooking Account…' : 'Bake Account'}
            </button>

            {/* Divider */}
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

            {/* Sign In Link */}
            <div style={{ textAlign: 'center', color: '#FFF8DC', fontSize: '0.9rem' }}>
              Already have an account?{' '}
              <Link to="/login" className="link-text" style={{ fontWeight: 'bold' }}>
                Sign in
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;