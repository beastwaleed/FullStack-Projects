import { useState, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom";

const Favorites = () => {
    const [favs, setFavs] = useState([]);
    const IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w500";
    const API_BASE = import.meta.env.VITE_BACKEND_URL ?? 'https://full-stack-projects-tau.vercel.app';
    const API_FAVS = `${API_BASE}/api/favorites`;

    const fetchFavs = async () => {
        try {
            const res = await axios.get(`${API_FAVS}/all`);
            // Deployed backend may wrap the array in an object like { value: [...] }
            const data = Array.isArray(res.data) ? res.data : (res.data.value ?? []);
            setFavs(data);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchFavs();
    }, []);

    const removeFav = async (mongoId) => {
        try {
            await axios.delete(`${API_FAVS}/${mongoId}`);
            // Refresh the list after deleting
            fetchFavs(); 
        } catch (err) {
            alert("Error removing movie");
        }
    };

    return (
        <div className="min-h-screen text-white p-8">
            <header className="flex justify-between items-center mb-12">
                <h1 className="text-2xl font-black uppercase tracking-tighter">My WatchList ❤️</h1>
                <Link to="/" className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg transition">
                    ← Browse More
                </Link>
            </header>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-8">
                {favs.map((movie) => (
                    <div key={movie._id} className="relative group">
                        <Link to={`/watch/${movie.tmdbId}`}>
                            <div className="rounded-xl overflow-hidden border border-white/5 group-hover:border-red-600/50 transition-colors">
                                <img src={`${IMAGE_BASE_URL}${movie.posterPath}`} alt={movie.title} className="w-full h-full object-cover" />
                            </div>
                            <h3 className="mt-3 text-sm font-medium truncate">{movie.title}</h3>
                        </Link>
                        
                        {/* THE DELETE BUTTON */}
                        <button 
                            onClick={() => removeFav(movie._id)}
                            className="absolute -top-2 -right-2 bg-red-600 text-white w-8 h-8 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center hover:bg-red-700 font-bold"
                        >
                            ✕
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Favorites;