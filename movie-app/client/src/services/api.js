import axios from 'axios'
import { UNSAFE_RSCDefaultRootErrorBoundary } from 'react-router-dom';
const API_KEY = import.meta.env.VITE_TMDB_API_KEY;
const BASE_URL = 'https://api.themoviedb.org/3';

export const getPopularMovies = async()=>{
    const respone = await axios.get(`${BASE_URL}/movie/popular?api_key=${API_KEY}`);
    return respone.data.results;
}

export const getTrendingMovies = async()=>{
    const respone = await axios.get(`${BASE_URL}/movie/trending?api_key=${API_KEY}`);
    return respone.data.results;
}

export const getMovieDetails = async(id)=>{
    const respone = await axios.get(`${BASE_URL}/movie/${id}?api_key=${API_KEY}`);
    return respone.data.results;
}