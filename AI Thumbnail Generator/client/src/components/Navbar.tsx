import { MenuIcon, XIcon, LogOutIcon } from "lucide-react";
import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { navlinks } from "../data/navlinks";
import type { INavLink } from "../types";
import { Link, NavLink, useNavigate } from "react-router-dom";

interface User {
    _id: string;
    name: string;
    email: string;
}

export default function Navbar() {
    const [isOpen, setIsOpen] = useState(false);
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        // Check if user is logged in
        const checkAuth = async () => {
            try {
                const response = await fetch("/api/auth/verify", {
                    credentials: "include"
                });
                if (response.ok) {
                    const data = await response.json();
                    setUser(data.user);
                } else {
                    setUser(null);
                }
            } catch (err) {
                setUser(null);
            } finally {
                setLoading(false);
            }
        };

        checkAuth();
    }, []);

    const handleLogout = async () => {
        try {
            const response = await fetch("/api/auth/logout", {
                method: "POST",
                credentials: "include"
            });
            if (response.ok) {
                setUser(null);
                navigate("/");
                window.location.reload();
            }
        } catch (err) {
            console.error("Logout failed:", err);
        }
    };

    return (
        <>
            <motion.nav className="fixed top-0 z-50 flex items-center justify-between w-full py-4 px-6 md:px-16 lg:px-24 xl:px-32 backdrop-blur"
                initial={{ y: -100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ type: "spring", stiffness: 250, damping: 70, mass: 1 }}
            >
                <Link to="/"><img src="./logo.svg" alt="logo" className="h-8.5 w-auto"/></Link>

                <div className="hidden md:flex items-center gap-8 transition duration-500">
                    <Link to='/' className="hover:text-pink-300 transition">Home</Link>
                    <Link to='/generate' className="hover:text-pink-300 transition">Generate</Link>
                    <Link to='/my-generation' className="hover:text-pink-300 transition">My Generations</Link>
                    <Link to='https://www.linkedin.com/in/digiwaleed' className="hover:text-pink-300 transition">Contact</Link>

                </div>

                {!loading && (
                    user ? (
                        <div className="hidden md:flex items-center gap-4">
                            <span className="text-sm text-zinc-400">Welcome, {user.name}</span>
                            <button 
                                onClick={handleLogout} 
                                className="px-6 py-2.5 bg-red-600 hover:bg-red-700 active:scale-95 transition-all rounded-full flex items-center gap-2"
                            >
                                <LogOutIcon size={16} />
                                Logout
                            </button>
                        </div>
                    ) : (
                        <button onClick={()=>navigate('/login')} className="hidden md:block px-6 py-2.5 bg-pink-600 hover:bg-pink-700 active:scale-95 transition-all rounded-full">
                            Get Started
                        </button>
                    )
                )}

                <button onClick={() => setIsOpen(true)} className="md:hidden">
                    <MenuIcon size={26} className="active:scale-90 transition" />
                </button>
            </motion.nav>

            <div className={`fixed inset-0 z-100 bg-black/40 backdrop-blur flex flex-col items-center justify-center text-lg gap-8 md:hidden transition-transform duration-400 ${isOpen ? "translate-x-0" : "-translate-x-full"}`}>
                
                    <Link onClick={() => setIsOpen(false)} to='/'>Home</Link>
                    <Link onClick={() => setIsOpen(false)} to='/generate'>Generate</Link>
                    <Link onClick={() => setIsOpen(false)} to='/my-generation'>My Generations</Link>
                    <Link onClick={() => setIsOpen(false)} to='https://www.linkedin.com/in/digiwaleed'>Contact</Link>
                    
                    {user ? (
                        <>
                            <span className="text-sm text-zinc-400">Welcome, {user.name}</span>
                            <button 
                                onClick={() => {
                                    setIsOpen(false);
                                    handleLogout();
                                }} 
                                className="px-6 py-2.5 bg-red-600 hover:bg-red-700 active:scale-95 transition-all rounded-full flex items-center gap-2"
                            >
                                <LogOutIcon size={16} />
                                Logout
                            </button>
                        </>
                    ) : (
                        <Link onClick={() => setIsOpen(false)} to='/login'>Login</Link>
                    )}

                <button onClick={() => setIsOpen(false)} className="active:ring-3 active:ring-white aspect-square size-10 p-1 items-center justify-center bg-pink-600 hover:bg-pink-700 transition text-white rounded-md flex">
                    <XIcon />
                </button>
            </div>
        </>
    );
}