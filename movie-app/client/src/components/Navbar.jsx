import { Link } from "react-router-dom";

const Navbar = () => {
    return (
        // Container to center the floating bar
        <nav className=" top-2 left-0 right-0 z-50 flex justify-center px-4 mb-5">
            
            {/* The Glass Pill */}
            <div className="w-full max-w-6xl px-6 py-3 flex justify-between items-center transition-all duration-300 ">
                
                {/* 1. Logo with Glow */}
                <Link to="/" className="group relative">
                    <span className="text-2xl font-black text-white tracking-tighter z-10 relative group-hover:text-red-500 transition-colors duration-300">
                        PLAYPULSE
                    </span>
                    {/* Red Glow Blob behind logo */}
                    <div className="absolute -inset-2 bg-red-600/20 blur-lg rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </Link>

                {/* 2. Centered Navigation (Hidden on mobile) */}
                <div className="hidden md:flex items-center gap-1 bg-white/5 rounded-full p-1 border border-white/5">
                    <Link to="/" className="px-5 py-1.5 rounded-full text-sm font-bold text-gray-400 hover:text-white hover:bg-white/10 transition-all">
                        Home
                    </Link>
                    <Link to="/favorites" className="px-5 py-1.5 rounded-full text-sm font-bold text-gray-400 hover:text-white hover:bg-white/10 transition-all">
                        Watchlist
                    </Link>
                    <a href="https://linkedin.com/in/digiwaleed" target="_blank" rel="noreferrer" className="px-5 py-1.5 rounded-full text-sm font-bold text-gray-400 hover:text-white hover:bg-white/10 transition-all">
                        Developer
                    </a>
                </div>

                {/* 3. Auth Actions */}
                <div className="flex items-center gap-4">
                    <Link to="/login" className="hidden md:block text-xs font-bold text-gray-300 hover:text-white transition tracking-widest uppercase">
                        Log In
                    </Link>
                    <Link 
                        to="/signup" 
                        className="bg-gradient-to-r from-red-600 to-red-800 text-white px-6 py-2 rounded-xl text-sm font-black tracking-wide shadow-lg hover:shadow-red-600/40 hover:scale-105 active:scale-95 transition-all duration-300 border border-white/10"
                    >
                        SIGN UP
                    </Link>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;