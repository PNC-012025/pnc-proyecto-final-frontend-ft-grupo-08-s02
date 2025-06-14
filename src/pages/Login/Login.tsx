import { useState, FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import { User, Lock } from 'lucide-react';

interface FormValues {
    email: string;
    password: string;
    remember: boolean;
}

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
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#003c71] to-[#00509e] px-4">
            <div className="bg-white shadow-lg rounded-2xl p-8 w-full max-w-md">
                <h2 className="text-3xl font-bold text-center text-[#003c71] mb-6">
                    Iniciar sesión
                </h2>

                {error && (
                    <div className="bg-red-100 text-red-600 p-2 rounded text-sm mb-4 text-center">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Email */}
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
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#003c71] transition"
                        />
                    </div>

                    {/* Contraseña */}
                    <div className="relative">
                        <Lock className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="password"
                            name="password"
                            value={values.password}
                            onChange={handleChange}
                            required
                            placeholder="Contraseña"
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#003c71] transition"
                        />
                    </div>

                    {/* Remember + Forgot */}
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

                    {/* Boton de inicio de sesion */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-[#003c71] hover:bg-[#00509e] text-white py-2 rounded-lg font-medium transition disabled:opacity-60"
                    >
                        {loading ? 'Iniciando...' : 'Iniciar sesión'}
                    </button>
                </form>

                <p className="text-center text-sm text-gray-600 mt-6">
                    ¿No tienes cuenta?{' '}
                    <Link to="/register" className="text-[#003c71] hover:underline">
                        Crear una cuenta
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default Login;
