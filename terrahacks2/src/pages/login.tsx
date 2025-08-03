import { useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';

export default function Login() {
  const [step, setStep] = useState('role-selection'); // 'role-selection', 'doctor-login', 'patient-login'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleRoleSelection = (userType: string) => {
    if (userType === 'doctor') {
      setStep('doctor-login');
    } else {
      setStep('patient-login');
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email,
          password
        })
      });

      const data = await response.json();

      if (response.ok) {
        console.log('Login successful:', data);
        
        // Store user data in localStorage for session management
        localStorage.setItem('user', JSON.stringify(data.user));
        
        // Redirect based on user type
        if (data.user.userType === 'doctor') {
          router.push('/doctor');
        } else {
          router.push('/patient');
        }
      } else {
        alert(data.error || 'Login failed. Please try again.');
      }
    } catch (error) {
      console.error('Login error:', error);
      alert('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const goBack = () => {
    setStep('role-selection');
    setEmail('');
    setPassword('');
  };

  // Role Selection Screen
  if (step === 'role-selection') {
    return (
      <>
        <Head>
          <title>RehabTrack - Welcome</title>
          <meta name="description" content="Welcome to RehabTrack" />
        </Head>
        
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f8fafc',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '40px',
            borderRadius: '12px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
            width: '100%',
            maxWidth: '400px',
            textAlign: 'center'
          }}>
            <div style={{ marginBottom: '40px' }}>
              <h1 style={{
                color: '#1e40af',
                fontSize: '32px',
                fontWeight: '700',
                margin: '0 0 12px 0'
              }}>
                RehabTrack
              </h1>
              <p style={{
                color: '#6b7280',
                fontSize: '18px',
                margin: '0 0 8px 0'
              }}>
                Welcome to your rehabilitation platform
              </p>
              <p style={{
                color: '#9ca3af',
                fontSize: '16px',
                margin: '0'
              }}>
                Please select your role to continue
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <button
                  onClick={() => handleRoleSelection('doctor')}
                  style={{
                    padding: '20px',
                    borderRadius: '12px',
                    border: '2px solid #e5e7eb',
                    backgroundColor: 'white',
                    color: '#374151',
                    fontSize: '18px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '12px'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#1e40af';
                    e.currentTarget.style.backgroundColor = '#eff6ff';
                    e.currentTarget.style.color = '#1e40af';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#e5e7eb';
                    e.currentTarget.style.backgroundColor = 'white';
                    e.currentTarget.style.color = '#374151';
                  }}
                >
                  <span style={{ fontSize: '24px' }}>🩺</span>
                  I'm a Doctor
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <button
                  onClick={() => handleRoleSelection('patient')}
                  style={{
                    padding: '20px',
                    borderRadius: '12px',
                    border: '2px solid #e5e7eb',
                    backgroundColor: 'white',
                    color: '#374151',
                    fontSize: '18px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '12px'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#059669';
                    e.currentTarget.style.backgroundColor = '#ecfdf5';
                    e.currentTarget.style.color = '#059669';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#e5e7eb';
                    e.currentTarget.style.backgroundColor = 'white';
                    e.currentTarget.style.color = '#374151';
                  }}
                >
                  <span style={{ fontSize: '24px' }}>👤</span>
                  I'm a Patient
                </button>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  // Login Form (Doctor or Patient)
  const isDoctor = step === 'doctor-login';
  const primaryColor = isDoctor ? '#1e40af' : '#059669';
  const lightColor = isDoctor ? '#eff6ff' : '#ecfdf5';

  return (
    <>
      <Head>
        <title>{isDoctor ? 'Doctor' : 'Patient'} Login - RehabTrack</title>
        <meta name="description" content={`${isDoctor ? 'Doctor' : 'Patient'} login for RehabTrack`} />
      </Head>
      
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f8fafc',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      }}>
        <div style={{
          backgroundColor: 'white',
          padding: '40px',
          borderRadius: '12px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
          width: '100%',
          maxWidth: '400px'
        }}>
          {/* Back Button */}
          <button
            onClick={goBack}
            style={{
              marginBottom: '20px',
              padding: '8px 12px',
              backgroundColor: 'transparent',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              color: '#6b7280',
              fontSize: '14px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            ← Back
          </button>

          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <div style={{
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              backgroundColor: lightColor,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px auto',
              fontSize: '24px'
            }}>
              {isDoctor ? '🩺' : '👤'}
            </div>
            <h1 style={{
              color: primaryColor,
              fontSize: '28px',
              fontWeight: '700',
              margin: '0 0 8px 0'
            }}>
              {isDoctor ? 'Doctor' : 'Patient'} Portal
            </h1>
            <p style={{
              color: '#6b7280',
              fontSize: '16px',
              margin: '0'
            }}>
              Sign in to your {isDoctor ? 'doctor' : 'patient'} account
            </p>
          </div>

          <form onSubmit={handleLogin}>
            {/* Email Input */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                color: '#374151',
                marginBottom: '6px'
              }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '16px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
                placeholder={`Enter your ${isDoctor ? 'doctor' : 'patient'} email`}
              />
            </div>

            {/* Password Input */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                color: '#374151',
                marginBottom: '6px'
              }}>
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '16px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
                placeholder="Enter your password"
              />
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={isLoading}
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: primaryColor,
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '16px',
                fontWeight: '500',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                opacity: isLoading ? 0.7 : 1
              }}
            >
              {isLoading ? 'Signing in...' : `Sign In as ${isDoctor ? 'Doctor' : 'Patient'}`}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}