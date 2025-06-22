import React from 'react';
import { Menu, X, ShoppingCart, Bell, UserCircle } from 'lucide-react';
import useLayout from '../hooks/useLayout';

const Header: React.FC = () => {
    const { toggleSidebar, collapsed } = useLayout();

    return (
        <header className="sticky top-0 z-20 w-full bg-[rgb(0,60,113)] text-white shadow flex items-center justify-between px-6 py-3">
            <div className="flex items-center">
                <h1 className="ml-4 text-xl font-semibold">REHOSAR</h1>
                <button
                    onClick={toggleSidebar}
                    className="p-2 hover:bg-white/20 rounded-full transition"
                >
                    {collapsed ? <Menu size={24} /> : <Menu size={24} />}
                </button>
                
            </div>

            <div className="flex items-center space-x-6">

                <button className="relative p-2 hover:bg-white/20 rounded-full transition">
                    <Bell size={20} />
                    <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white bg-red-600 rounded-full">
                        0
                    </span>
                </button>

                <button className="p-2 hover:bg-white/20 rounded-full transition">
                    <UserCircle size={24} />
                </button>
            </div>
            </header>
        );
    }
    
    export default Header;
