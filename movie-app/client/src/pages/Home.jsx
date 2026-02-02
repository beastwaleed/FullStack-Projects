import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import 'ldrs/ring';

const Home = () => {
    const [movies, setMovies] = useState([]);
    const [featuredMovie, setFeaturedMovie] = useState(null);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    const API_KEY = import.meta.env.VITE_TMDB_API_KEY;
    const IMAGE_BASE_URL = "https://image.tmdb.org/t/p/original";
    const POSTER_BASE_URL = "https://image.tmdb.org/t/p/w500";

    const fetchMovies = async (query = "") => {
        setLoading(true);
        try {
            const endpoint = query 
                ? `https://api.themoviedb.org/3/search/movie?api_key=${API_KEY}&query=${query}`
                : `https://api.themoviedb.org/3/movie/popular?api_key=${API_KEY}`;
            
            const response = await axios.get(endpoint);
            const results = response.data.results;
            
            setMovies(results);
            if (results.length > 0 && !query && !featuredMovie) {
                const randomIdx = Math.floor(Math.random()*results.length);
                setFeaturedMovie(results[randomIdx]);
            }
            setLoading(false);
        } catch (error) {
            console.error("Error fetching movies: ", error);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMovies();
    }, []);

    const handleSearch = (e) => {
        e.preventDefault();
        fetchMovies(searchQuery);
    };

    if (loading) return (
        <div className="flex h-screen items-center justify-center ">
            <l-ring size="60" color="red"></l-ring>
        </div>
    );

    return (
        <div className="min-h-screen text-white font-sans selection:bg-red-600">
            
            {/* --- HERO SECTION --- */}
            {!searchQuery && featuredMovie && (
                <div className="relative w-full h-[60vh] md:h-[80vh] overflow-hidden">
                    <div className="absolute inset-0">
                        <img 
                            src={`${IMAGE_BASE_URL}${featuredMovie.backdrop_path}`} 
                            alt={featuredMovie.title}
                            className="w-full h-full object-cover opacity-60"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent"></div>
                        <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0a] via-transparent to-transparent"></div>
                    </div>

                    <div className="relative z-10 h-full flex flex-col justify-center px-6 md:px-16 max-w-5xl pt-20">
                        <h1 className="text-2xl text-left md:text-4xl font-black uppercase tracking-tighter mb-4 italic drop-shadow-2xl">
                            {featuredMovie.title}
                        </h1>
                        <p className="text-lg text-left text-gray-300 mb-8 line-clamp-2 max-w-2xl">
                            {featuredMovie.overview}
                        </p>
                        <Link 
                            to={`/watch/${featuredMovie.id}`}
                            className="bg-red-600 hover:bg-red-700 text-white w-fit px-8 py-3 rounded-xl font-black text-sm uppercase tracking-widest transition-all shadow-lg"
                        >
                            Play Now
                        </Link>
                    </div>
                </div>
            )}

            {/* --- SEARCH BAR SECTION (Clean & Static) --- */}
            <div className="bg-[#0a0a0a] border-b border-white/5 py-8 px-6 top-16 z-40 shadow-xl">
                <div className="max-w-4xl mx-auto">
                    <form onSubmit={handleSearch} className="relative group">
                        <input 
                            type="text" 
                            placeholder="Find your next favorite movie..." 
                            className="w-full pl-6 pr-14 py-4 rounded-2xl bg-[#161616] border border-white/10 focus:outline-none focus:border-red-600 focus:bg-[#1a1a1a] transition-all text-lg placeholder:text-gray-600"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <button type="submit" className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-red-600 transition-colors text-xl">
                            🔍
                        </button>
                    </form>
                </div>
            </div>

            {/* --- MOVIE GRID SECTION --- */}
            <div className="px-6 md:px-16 py-12 max-w-[1400px] mx-auto">
                <div className="flex items-center gap-4 mb-10">
                    <div className="h-6 w-1 bg-red-600 rounded-full"></div>
                    <h3 className="text-xl font-black tracking-widest uppercase italic">
                        {searchQuery ? `Results for "${searchQuery}"` : "Trending Now"}
                    </h3>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-6 gap-y-12">
                    {movies.length > 0 ? (
                        movies.map((movie) => (
                            <Link to={`/watch/${movie.id}`} key={movie.id} className="group block">
                                <div className="relative aspect-[2/3] rounded-2xl overflow-hidden bg-[#161616] border border-white/5 transition-all duration-300 group-hover:scale-105 group-hover:border-red-600/50">
                                    <img 
                                        src={movie.poster_path ? `${POSTER_BASE_URL}${movie.poster_path}` : 'https://via.placeholder.com/500x750?text=No+Poster'} 
                                        alt={movie.title} 
                                        className="w-full h-full object-cover"
                                    />
                                    <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md px-2 py-1 rounded-lg text-yellow-500 text-[10px] font-black border border-white/10">
                                        ⭐ {movie.vote_average?.toFixed(1)}
                                    </div>
                                </div>
                                <div className="mt-4">
                                    <h4 className="font-bold text-sm truncate group-hover:text-red-600 transition-colors">
                                        {movie.title}
                                    </h4>
                                    <p className="text-[10px] font-bold text-gray-500 mt-1 uppercase tracking-tighter">
                                        {movie.release_date?.split('-')[0]} • Movie
                                    </p>
                                </div>
                            </Link>
                        ))
                    ) : (
                        <div className="col-span-full py-20 text-center text-gray-600">
                            No movies found.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Home;