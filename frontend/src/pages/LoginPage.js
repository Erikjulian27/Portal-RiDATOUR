import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { toast } from 'sonner';
import { Loader2, Mail, Lock, ChevronLeft, ChevronRight } from 'lucide-react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const LOGO_URL = "https://customer-assets.emergentagent.com/job_hajj-ops-1/artifacts/7t8146sg_logo-ridatour.png";

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [slides, setSlides] = useState([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const { login } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch slides
    const fetchSlides = async () => {
      try {
        const response = await axios.get(`${BACKEND_URL}/api/slides`);
        setSlides(response.data);
      } catch (error) {
        console.log('No slides available');
      }
    };
    fetchSlides();
  }, []);

  // Auto-advance slides
  useEffect(() => {
    if (slides.length > 1) {
      const interval = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % slides.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [slides.length]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast.success('Login successful!');
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const defaultBgImage = 'https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2Njl8MHwxfHNlYXJjaHwxfHxtZWNjYSUyMGthYWJhfGVufDB8fHx8MTczMjYwMDAwMHww&ixlib=rb-4.0.3&q=85';

  return (
    <div className="min-h-screen grid lg:grid-cols-2" data-testid="login-page">
      {/* Left side - Login form */}
      <div className="flex items-center justify-center p-6 sm:p-8 bg-white order-2 lg:order-1">
        <div className="w-full max-w-md space-y-8">
          <div className="flex justify-center">
            <img 
              src={LOGO_URL} 
              alt="RiDATOUR" 
              className="h-16 sm:h-20 w-auto object-contain"
            />
          </div>

          <Card className="border-0 shadow-none">
            <CardHeader className="text-center space-y-2 pb-6">
              <CardTitle className="text-2xl font-heading font-bold text-slate-900">
                {t('loginTitle')}
              </CardTitle>
              <CardDescription className="text-slate-500">
                {t('loginSubtitle')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-slate-700">{t('email')}</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <Input
                      id="email"
                      type="email"
                      placeholder="admin@ridatour.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 h-11"
                      required
                      data-testid="login-email"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-slate-700">{t('password')}</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 h-11"
                      required
                      data-testid="login-password"
                    />
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full h-11 bg-violet-700 hover:bg-violet-800 text-white font-medium"
                  disabled={loading}
                  data-testid="login-submit"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    t('login')
                  )}
                </Button>
              </form>

              <div className="mt-6 p-4 bg-slate-50 rounded-lg">
                <p className="text-xs text-slate-500 text-center">
                  Demo Account: admin@ridatour.com / admin123
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Right side - Slides carousel */}
      <div className="relative h-64 lg:h-auto order-1 lg:order-2 overflow-hidden" data-testid="login-slides">
        {slides.length > 0 ? (
          <>
            {/* Slides */}
            {slides.map((slide, index) => (
              <div
                key={slide.id}
                className={`absolute inset-0 transition-opacity duration-700 ${
                  index === currentSlide ? 'opacity-100' : 'opacity-0'
                }`}
              >
                <img
                  src={`${BACKEND_URL}/api/files/${slide.image_url}`}
                  alt={slide.title || `Slide ${index + 1}`}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
                
                {/* Slide content */}
                {(slide.title || slide.description) && (
                  <div className="absolute bottom-0 left-0 right-0 p-6 lg:p-12 text-white">
                    {slide.title && (
                      <h2 className="text-xl lg:text-3xl font-heading font-bold mb-2">{slide.title}</h2>
                    )}
                    {slide.description && (
                      <p className="text-sm lg:text-lg text-white/80">{slide.description}</p>
                    )}
                  </div>
                )}
              </div>
            ))}

            {/* Navigation arrows */}
            {slides.length > 1 && (
              <>
                <button
                  onClick={prevSlide}
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/30 transition-colors"
                  data-testid="slide-prev"
                >
                  <ChevronLeft size={24} />
                </button>
                <button
                  onClick={nextSlide}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/30 transition-colors"
                  data-testid="slide-next"
                >
                  <ChevronRight size={24} />
                </button>

                {/* Dots indicator */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                  {slides.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentSlide(index)}
                      className={`w-2 h-2 rounded-full transition-all ${
                        index === currentSlide 
                          ? 'bg-white w-6' 
                          : 'bg-white/50 hover:bg-white/75'
                      }`}
                      data-testid={`slide-dot-${index}`}
                    />
                  ))}
                </div>
              </>
            )}
          </>
        ) : (
          /* Default background if no slides */
          <>
            <div 
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${defaultBgImage})` }}
            />
            <div className="absolute inset-0 bg-gradient-to-br from-violet-900/80 to-violet-700/60"></div>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-6 lg:p-12">
              <h2 className="text-2xl lg:text-4xl font-heading font-bold mb-4 text-center">
                Your Journey Starts Here
              </h2>
              <p className="text-base lg:text-lg text-white/80 text-center max-w-md">
                Manage your Umrah & Hajj operations with our comprehensive internal portal system.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default LoginPage;
