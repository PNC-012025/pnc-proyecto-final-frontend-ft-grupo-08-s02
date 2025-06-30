import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, createContext } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import { Outlet } from 'react-router-dom';
export const LayoutContext = createContext({
    collapsed: false,
    toggleSidebar: () => { },
});
const Layout = () => {
    const [collapsed, setCollapsed] = useState(false);
    const toggleSidebar = () => setCollapsed(c => !c);
    return (_jsx(LayoutContext.Provider, { value: { collapsed, toggleSidebar }, children: _jsxs("div", { className: "flex flex-col h-screen", children: [_jsx(Header, {}), _jsxs("div", { className: "flex flex-1 overflow-hidden", children: [_jsx(Sidebar, {}), _jsx("main", { className: "flex-1 overflow-auto p-6 bg-gray-100", children: _jsx(Outlet, {}) })] })] }) }));
};
export default Layout;
