import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import ReactPlayer from 'react-player';

const Watch = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [videoKey, setVideoKey] = useState(null);
    const [movieDetails, setMovieDetails] = useState(null);
    const [viewMode, setViewMode] = useState('movie'); 
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    const API_KEY = import.meta.env.VITE_TMDB_API_KEY;
    const API_BASE = import.meta.env.VITE_BACKEND_URL ?? 'https://full-stack-projects-tau.vercel.app';
    const BACKEND_URL = `${API_BASE}/api/favorites`;

    useEffect(() => {
        const fetchWatchData = async () => {
            try {
                const detailRes = await axios.get(`https://api.themoviedb.org/3/movie/${id}?api_key=${API_KEY}`);
                setMovieDetails(detailRes.data);

                const videoRes = await axios.get(`https://api.themoviedb.org/3/movie/${id}/videos?api_key=${API_KEY}`);
                // Fix: YouTube is case-sensitive
                const trailer = videoRes.data.results.find(vid => vid.site === "YouTube" && vid.type === "Trailer");
                if (trailer) setVideoKey(trailer.key);

                setLoading(false);
            }
            catch (error) {
                console.error("Error: ", error);
                setLoading(false);
            }
        };
        fetchWatchData();
    }, [id, API_KEY]);

    const addToFav = async () => {
        setIsSaving(true);
        try {
            await axios.post(`${BACKEND_URL}/add`, {
                tmdbId: id,
                title: movieDetails.title,
                posterPath: movieDetails.poster_path
            });
            alert("Added to your Watchlist! ❤️");
        }
        catch (err) {
            // Fix: Use 'err' to match your catch variable
            alert(err.response?.data?.message || "Already in your favorites!");
        }
        finally {
            setIsSaving(false);
        }
    };

    if (loading) return (
        <div className="h-screen flex flex-col items-center justify-center text-white">
            <l-ring size="60" color="coral"></l-ring>
            <p className="mt-4 animate-pulse text-gray-400">Preparing your cinema...</p>
        </div>
    );

    return (
        <div className="min-h-screen  text-white p-4">
            <div className="max-w-6xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-white transition-colors">← Back</button>

                    <div className="flex bg-[#1a1a1a] p-1 rounded-lg">
                        <button onClick={() => setViewMode('movie')} className={`px-4 py-1 rounded-md transition ${viewMode === 'movie' ? 'bg-red-600 text-white' : 'text-gray-400'}`}>Full Movie</button>
                        <button onClick={() => setViewMode('trailer')} className={`px-4 py-1 rounded-md transition ${viewMode === 'trailer' ? 'bg-red-600 text-white' : 'text-gray-400'}`}>Trailer</button>
                    </div>
                </div>

                <div className="relative aspect-video bg-black rounded-xl overflow-hidden shadow-2xl border border-white/5">
                    {viewMode === 'movie' ? (
                        <iframe 
                            src={`https://vidsrc.xyz/embed/movie/${id}`} 
                            className="w-full h-full"
                            frameBorder="0" 
                            allowFullScreen
                            scrolling="no"
                            title="Movie Player"
                        ></iframe>
                    ) : (
                        videoKey ? (
                            <ReactPlayer
                                url={`https://www.youtube.com/watch?v=${videoKey}`}
                                width="100%"
                                height="100%"
                                controls
                                playing
                            />
                        ) : (
                            <div className="flex h-full items-center justify-center">No Trailer Found</div>
                        )
                    )}
                </div>

                {movieDetails && (
                    <div className="mt-10">
                        <div className="flex justify-between items-start">
                            <div>
                                <h1 className="text-4xl font-black italic tracking-tighter uppercase mb-2">{movieDetails.title}</h1>
                                <div className="flex gap-4 text-sm text-gray-500 mb-6">
                                    <span>{movieDetails.release_date?.split('-')[0]}</span>
                                    <span>{movieDetails.runtime} min</span>
                                    <span className="text-yellow-500 font-bold">⭐ {movieDetails.vote_average?.toFixed(1)}</span>
                                </div>
                            </div>
                            {/* Button moved inside movieDetails check for cleaner UI */}
                            <button 
                                onClick={addToFav}
                                disabled={isSaving}
                                className={`whitespace-nowrap px-8 py-4 rounded-2xl font-black uppercase tracking-widest transition-all ${isSaving ? 'bg-gray-600' : 'bg-white text-black hover:bg-red-600 hover:text-white hover:scale-105 active:scale-95'}`}
                            >
                                {isSaving ? "Saving..." : "❤ Add to List"}
                            </button>
                        </div>
                        <p className="text-gray-300 text-left  text-sm max-w-3xl leading-relaxed">{movieDetails.overview}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Watch;