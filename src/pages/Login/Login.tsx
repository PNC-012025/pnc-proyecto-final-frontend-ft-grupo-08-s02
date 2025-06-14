import { useState, FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import { User, Lock } from 'lucide-react';
import { Carousel } from 'react-responsive-carousel';
import 'react-responsive-carousel/lib/styles/carousel.min.css';

import img1 from '../../assets/login/DEI.jpg';
import img2 from '../../assets/login/edificio.jpg';
import img3 from '../../assets/login/Mural.jpg';

interface FormValues {
    email: string;
    password: string;
    remember: boolean;
}

const slides = [
    {
        image: img1,
        title: '¡Bienvenido!',
        description: 'Inicia sesión y gestiona tus actividades fácilmente.',
    },
    {
        image: img2,
        title: 'Registra tus horas',
        description: 'Lleva el control de tu tiempo con eficiencia.',
    },
    {
        image: img3,
        title: 'Aprende y colabora',
        description: 'Comparte tus logros con otros estudiantes.',
    },
];

const Login: React.FC = () => {
    const [values, setValues] = useState<FormValues>({
        email: '',
        password: '',
        remember: false,
    });
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        setValues((v) => ({
            ...v,
            [name]: type === 'checkbox' ? checked : value,
        }));
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);
        try {
            await login({ email: values.email, password: values.password });
            navigate('/dashboard');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Credenciales inválidas');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col lg:flex-row">
            {/* Panel izquierdo con carrusel de imagen + texto */}
            <div className="relative hidden lg:flex lg:w-[60%] bg-black">
                <Carousel
                    autoPlay
                    infiniteLoop
                    showThumbs={false}
                    showStatus={false}
                    interval={5000}
                    showArrows={false}
                    showIndicators={true}
                    swipeable
                    className="w-full h-screen"
                >
                    {slides.map((slide, i) => (
                        <div key={i} className="relative w-full h-full">
                            <img
                                src={slide.image}
                                alt={`slide-${i}`}
                                className="object-cover w-full h-screen opacity-80"
                            />
                            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30">
                                <div className="text-white text-center px-8 max-w-xl">
                                    <h2 className="text-4xl font-bold mb-4 drop-shadow-lg">{slide.title}</h2>
                                    <p className="text-lg drop-shadow">{slide.description}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </Carousel>
            </div>

            {/* Panel derecho: login */}
            <div className="flex w-full lg:w-[40%] items-center justify-center p-8 bg-white">
                <div className="max-w-md w-full space-y-6">
                    <h1 className="text-3xl font-bold text-gray-800 text-center">
                        Iniciar sesión
                    </h1>

                    {error && (
                        <div className="bg-red-100 text-red-600 p-2 rounded text-sm text-center">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="relative">
                            <User className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400" size={20} />
                            <input
                                type="email"
                                name="email"
                                value={values.email}
                                onChange={handleChange}
                                required
                                placeholder="Correo electrónico"
                                autoFocus
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-[#003c71]"
                            />
                        </div>

                        <div className="relative">
                            <Lock className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400" size={20} />
                            <input
                                type="password"
                                name="password"
                                value={values.password}
                                onChange={handleChange}
                                required
                                placeholder="Contraseña"
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-[#003c71]"
                            />
                        </div>

                        <div className="flex items-center justify-between text-sm">
                            <label className="flex items-center space-x-2 text-gray-600">
                                <input
                                    type="checkbox"
                                    name="remember"
                                    checked={values.remember}
                                    onChange={handleChange}
                                    className="h-4 w-4 text-[#003c71] border-gray-300 rounded focus:ring-[#003c71]"
                                />
                                <span>Recordarme</span>
                            </label>
                            <Link to="/forgot-password" className="text-[#003c71] hover:underline">
                                ¿Olvidaste tu contraseña?
                            </Link>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-[#003c71] to-[#00509e] hover:opacity-90 text-white py-2 rounded-full font-semibold transition disabled:opacity-50"
                        >
                            {loading ? 'Iniciando...' : 'Iniciar sesión'}
                        </button>
                    </form>

                    <p className="text-center text-sm text-gray-600">
                        ¿No tienes una cuenta?{' '}
                        <Link to="/register" className="text-[#003c71] hover:underline">
                            Crear una cuenta
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;
