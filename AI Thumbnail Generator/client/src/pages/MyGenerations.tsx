import { Link, useNavigate } from "react-router-dom";
import { dummyThumbnails, type IThumbnail } from "../assets/assets";
import SoftBackdrop from "../components/SoftBackdrop"
import { useEffect, useState } from "react";
import { ArrowUpRightFromSquareIcon, DownloadIcon, TrashIcon, PlusIcon, SearchIcon } from "lucide-react";

const MyGenerations = () => {

  const navigate = useNavigate();
  
  const aspectRatioClassMap : Record<string, string> = {
    '16:9' : 'aspect-video',
    '1:1' : 'aspect-square',
    '9:16': 'aspect-[9/16]'
  }

  const [thumbnails, setThumbnails] = useState<IThumbnail[]>([]);
  const [filteredThumbnails, setFilteredThumbnails] = useState<IThumbnail[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);

  const fetchThumbnails = async(query = '') =>{
    try {
      setLoading(true);
      
      // Check auth first
      const authResponse = await fetch("/api/auth/verify", {
        credentials: "include"
      });
      
      if (!authResponse.ok) {
        navigate("/login");
        return;
      }
      
      const authData = await authResponse.json();
      setUser(authData.user);

      // Fetch user's thumbnails from API with search query
      const url = new URL("/api/thumbnails", window.location.origin);
      if (query) {
        url.searchParams.append('search', query);
      }

      const thumbResponse = await fetch(url.toString(), {
        credentials: "include"
      });

      if (!thumbResponse.ok) throw new Error('Failed to fetch thumbnails');
      
      const thumbData = await thumbResponse.json();
      setThumbnails(thumbData.thumbnails || []);
      setFilteredThumbnails(thumbData.thumbnails || []);
    } catch (err) {
      console.error("Error fetching thumbnails:", err);
      setThumbnails([]);
      setFilteredThumbnails([]);
    } finally {
      setLoading(false);
    }
  }

  const handleDownload = async (image_url: string, title: string) => {
    try {
      const response = await fetch(image_url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${title || 'thumbnail'}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download failed:", err);
      alert('Failed to download image');
    }
  }

  const handleDelete = async(id: string)=>{
    if (!confirm('Are you sure you want to delete this thumbnail?')) return;
    
    try {
      setDeleting(id);
      const response = await fetch(`/api/thumbnails/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (!response.ok) throw new Error('Failed to delete thumbnail');
      
      setThumbnails(prev => prev.filter(t => t._id !== id));
      setFilteredThumbnails(prev => prev.filter(t => t._id !== id));
    } catch (err) {
      console.error("Delete failed:", err);
      alert('Failed to delete thumbnail');
    } finally {
      setDeleting(null);
    }
  }

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    // Only search if query is empty (reset) or has at least 2 characters
    if (query === '' || query.trim().length >= 2) {
      fetchThumbnails(query);
    }
  }

  useEffect(()=>{
    fetchThumbnails();
  },[])


  return (
    <>
    <SoftBackdrop/>
    <div className="mt-32 min-h-screen px-6 md:px-16 lg:px-24 xl:px-32">
      {/* Header */}
      <div className="mb-8 flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-zinc-200">My Generations</h1>
          <p className="text-sm text-zinc-400 mt-1">View and manage all your AI-generated thumbnails</p>
        </div>
        <button 
          onClick={() => navigate("/generate")}
          className="px-6 py-2.5 bg-pink-600 hover:bg-pink-700 rounded-full flex items-center gap-2 transition"
        >
          <PlusIcon size={18} />
          New Thumbnail
        </button>
      </div>

      {/* Search Bar */}
      {!loading && thumbnails.length > 0 && (
        <div className="mb-6">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-3 size-5 text-zinc-400" />
            <input
              type="text"
              placeholder="Search thumbnails by title..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg bg-white/6 border border-white/10 text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-pink-600 transition"
            />
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({length:6}).map((_,i)=>(
            <div key={i} className="rounded-2xl bg-white/6 border border-white/10 animate-pulse h-[260px]"/>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredThumbnails.length === 0 && (
        <div className="text-center py-24">
          <h3 className="text-lg font-semibold text-zinc-200">{searchQuery ? 'No thumbnails found' : 'No thumbnails yet'}</h3>
          <p className="text-sm text-zinc-400 mt-2">{searchQuery ? 'Try a different search term' : 'Generate your first thumbnail to see it here'}</p>
        </div>
      )}

      {/* GRID */}
      {!loading && filteredThumbnails.length > 0 && (
        <div className="colums-1 sm:columns-3 2xl:columns-4 gap-8">
          {filteredThumbnails.map((thumb: IThumbnail)=>{
            const aspectClass = aspectRatioClassMap[thumb.aspect_ratio || '16:9'];
            return(
              <div key={thumb._id} onClick={()=>navigate(`/generate/${thumb._id}`)} className="mb-8 group relative cursor-pointer rounded-2xl bg-white/6 border border-white/10 transition shadow-xl break-inside-avoid">
                {/* IMAGE */}
                <div className={`relative overflow-hidden rounded-t-2xl ${aspectClass} bg-black`}>
                {thumb.image_url?(<img src={thumb.image_url} alt={thumb.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"/>
                ):(
                  <div className="w-full h-full flex items-center justify-center text-sm text-zinc-400">
                    {thumb.isGenerating?'Generating...' : 'No Image'}
                  </div>
                )}
                {thumb.isGenerating && <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-sm font-medium">Generating</div>}
                </div>
                {/* CONTENT */}
                <div className="p-4 space-y-2">
                  <h3 className="text-sm font-semibold text-zinc-100 line-clamp-2">{thumb.title}</h3>
                  <div className="flex flex-wrap gap-2 text-xs text-zinc-400">
                    <span className="px-2 py-0.5 rounded bg-white/8">{thumb.style}</span>
                    <span className="px-2 py-0.5 rounded bg-white/8">{thumb.color_scheme}</span>
                    <span className="px-2 py-0.5 rounded bg-white/8">{thumb.aspect_ratio}</span>
                  </div>
                  <p className="text-xs text-zinc-500">{new Date(thumb.createdAt!).toDateString()}</p>
                </div>
                {/* Action Icons */}
                <div onClick={(e)=>e.stopPropagation()} className="absolute bottom-2 right-2 max-sm:flex sm:hidden group-hover:flex gap-1.5">
                  <button
                    onClick={() => handleDelete(thumb._id)}
                    disabled={deleting === thumb._id}
                    className="disabled:opacity-50"
                  >
                    <TrashIcon className="size-6 bg-black/50 p-1 rounded hover:bg-red-600 transition-all" />
                  </button>

                  <button
                    onClick={() => handleDownload(thumb.image_url!, thumb.title)}
                    className="hover:bg-pink-600"
                  >
                    <DownloadIcon className="size-6 bg-black/50 p-1 rounded hover:bg-pink-600 transition-all"/>
                  </button>
                  <Link target="_blank" to={`/preview?thumbnail_url=${thumb.image_url}&title=${thumb.title}`}>
                    <ArrowUpRightFromSquareIcon className="size-6 bg-black/50 p-1 rounded hover:bg-pink-600 transition-all"/>
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
    </>
  )
}

export default MyGenerations