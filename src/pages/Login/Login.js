import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import useAuth from '../../hooks/useAuth';
import { User, Lock } from 'lucide-react';
import { Carousel } from 'react-responsive-carousel';
import 'react-responsive-carousel/lib/styles/carousel.min.css';
import img1 from '../../assets/login/DEI.jpg';
import img2 from '../../assets/login/edificio.jpg';
import img3 from '../../assets/login/Mural.jpg';
const slides = [
    {
        image: img1,
        title: '¡Bienvenido a REHOSAR!',
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
const Login = () => {
    const [values, setValues] = useState({ email: '', password: '' });
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const { signin } = useAuth();
    const handleChange = (e) => {
        const { name, value } = e.target;
        setValues(v => ({ ...v, [name]: value }));
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);
        try {
            await signin({ email: values.email.trim(), password: values.password });
            // signin() ya hace navigate al dashboard
        }
        catch (err) {
            setError(err.response?.data?.message || 'Credenciales inválidas');
        }
        finally {
            setLoading(false);
        }
    };
    return (_jsxs("div", { className: "min-h-screen flex flex-col lg:flex-row font-sans", children: [_jsx("div", { className: "relative hidden lg:flex lg:w-[55%] bg-black shadow-xl", children: _jsx(Carousel, { autoPlay: true, infiniteLoop: true, showThumbs: false, showStatus: false, interval: 5000, showArrows: false, swipeable: true, className: "w-full h-screen", children: slides.map((slide, i) => (_jsxs("div", { className: "relative w-full h-full", children: [_jsx("img", { src: slide.image, alt: slide.title, className: "object-cover w-full h-screen opacity-75" }), _jsx("div", { className: "absolute inset-0 flex items-center justify-center bg-black bg-opacity-50", children: _jsxs("div", { className: "text-white text-center px-8 max-w-xl animate-fadeInUp", children: [_jsx("h2", { className: "text-5xl font-bold mb-4 drop-shadow-lg", children: slide.title }), _jsx("p", { className: "text-lg drop-shadow text-gray-200", children: slide.description })] }) })] }, i))) }) }), _jsx("div", { className: "flex w-full lg:w-[45%] items-center justify-center p-6 bg-gray-50", children: _jsxs("div", { className: "max-w-md w-full bg-white p-8 rounded-2xl shadow-2xl space-y-8 animate-fadeIn", children: [_jsxs("div", { className: "text-center space-y-2", children: [_jsx("div", { className: "mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-[#003c71] to-[#00509e] flex items-center justify-center shadow-md", children: _jsx(User, { className: "text-white", size: 28 }) }), _jsx("h1", { className: "text-3xl font-bold text-gray-800", children: "Iniciar sesi\u00F3n" }), _jsxs("p", { className: "text-sm text-gray-500", children: ["Accede a tu cuenta para comenzar a usar ", _jsx("strong", { children: "REHOSAR" })] })] }), error && (_jsx("div", { className: "bg-red-100 text-red-600 p-2 rounded text-sm text-center", children: error })), _jsxs("form", { onSubmit: handleSubmit, className: "space-y-5", children: [_jsxs("div", { className: "relative flex items-center", children: [_jsx(User, { className: "absolute left-3 text-gray-400", size: 20 }), _jsx("input", { type: "email", name: "email", value: values.email, onChange: handleChange, required: true, placeholder: "Correo electr\u00F3nico", className: "w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#003c71] shadow-sm" })] }), _jsxs("div", { className: "relative", children: [_jsx(Lock, { className: "absolute top-1/2 left-3 -translate-y-1/2 text-gray-400", size: 20 }), _jsx("input", { type: "password", name: "password", value: values.password, onChange: handleChange, required: true, placeholder: "Contrase\u00F1a", className: "w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#003c71] shadow-sm" })] }), _jsx("button", { type: "submit", disabled: loading, className: "w-full bg-gradient-to-r from-[#003c71] to-[#00509e] hover:opacity-90 text-white py-2 rounded-xl font-semibold transition disabled:opacity-50 shadow", children: loading ? 'Iniciando...' : 'Iniciar sesión' })] })] }) })] }));
};
export default Login;
