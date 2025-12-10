import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { NotificationButton } from "@/components/NotificationButton";
import { Input } from "@/components/ui/input";
import { 
  Calendar, 
  Clock, 
  Flame, 
  Droplets, 
  ShieldAlert, 
  Siren,
  Home as HomeIcon, 
  Users, 
  BookOpen,
  Search,
  ChevronRight
} from "lucide-react";

// --- INTERFACES ---
interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string | null;
  image_url: string | null;
  author_name: string;
  category: string | null;
  views: number;
  published_at: string | null;
  created_at: string;
  status: string;
}

// --- ARRIÈRE-PLAN ANIMÉ ---
const BackgroundIcons = () => {
  const icons = [
    { Icon: Flame, x: "10%", delay: 0, duration: 25 },
    { Icon: Droplets, x: "85%", delay: 2, duration: 28 },
    { Icon: ShieldAlert, x: "20%", delay: 5, duration: 30 },
    { Icon: Siren, x: "70%", delay: 1, duration: 35 },
    { Icon: Flame, x: "90%", delay: 8, duration: 22 },
  ];

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {icons.map((item, index) => (
        <motion.div
          key={index}
          className="absolute text-[#C41E25]/10 opacity-10"
          initial={{ y: "110vh", x: item.x, opacity: 0 }}
          animate={{ 
            y: "-10vh", 
            opacity: [0, 0.2, 0.2, 0],
            rotate: [0, 45, -45, 0] 
          }}
          transition={{
            duration: item.duration,
            repeat: Infinity,
            delay: item.delay,
            ease: "linear",
          }}
        >
          <item.Icon size={index % 2 === 0 ? 150 : 100} />
        </motion.div>
      ))}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0A0D14] via-[#0F1219]/95 to-[#0A0D14] opacity-95"></div>
    </div>
  );
};

// --- COMPOSANT PRINCIPAL ---
const Blog = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchPosts();
  }, []);

  useEffect(() => {
    const results = posts.filter(post => 
      post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.excerpt?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredPosts(results);
  }, [searchTerm, posts]);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('status', 'published')
        .order('published_at', { ascending: false });

      if (error) throw error;
      setPosts(data as BlogPost[]);
      setFilteredPosts(data as BlogPost[]);
    } catch (error) {
      console.error('Erreur chargement blog:', error);
      toast.error("Impossible de charger les articles.");
    } finally {
      setLoading(false);
    }
  };

  // --- Calcul du temps de lecture (RETOURNE SEULEMENT LE NOMBRE) ---
  const calculateReadTime = (content: string | null) => {
    if (!content) return null;
    
    // Enlever les balises HTML pour compter les vrais mots
    const text = content.replace(/<[^>]*>?/gm, '');
    // Enlever les espaces multiples
    const cleanText = text.replace(/\s+/g, ' ').trim();
    
    if (cleanText.length === 0) return null;

    const words = cleanText.split(' ').length;
    
    // Si moins de 30 mots, on ne considère pas qu'il y a un temps de lecture pertinent
    if (words < 30) return null;

    const minutes = Math.ceil(words / 200);
    return minutes; // Retourne seulement le nombre
  };

  // --- FORMATAGE DATE (Seulement jour/mois/année) ---
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "";
    // Utilise un format strict (jour, mois abrégé, année)
    return format(new Date(dateString), "d MMM yyyy", { locale: fr });
  };

  return (
    <div className="min-h-screen bg-[#0A0D14] text-white flex flex-col font-sans relative pb-28 overflow-hidden selection:bg-[#C41E25] selection:text-white">
      
      <BackgroundIcons />

      {/* HEADER FIXE AVEC RECHERCHE ET NOTIFICATION */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-[#0A0D14]/80 backdrop-blur-xl border-b border-white/5 pt-4 pb-4 px-4">
        <div className="max-w-5xl mx-auto space-y-4">
          <div className="flex items-center justify-between">
            <div>
                <h1 className="text-xl font-bold tracking-wider text-white font-serif">
                  LE POMPIER
                </h1>
                <p className="text-[10px] text-gray-400 uppercase tracking-widest">Journal d'intervention</p>
            </div>
            <div className="flex items-center gap-2">
                {/* Bouton Notification intégré ici */}
                <NotificationButton />
            </div>
          </div>
          
          {/* Barre de recherche */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <Input 
              className="w-full bg-[#151A26] border-white/10 pl-10 text-sm focus-visible:ring-[#C41E25] rounded-full h-10 text-white placeholder:text-gray-600"
              placeholder="Rechercher une intervention, un guide..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </header>

      {/* CONTENU PRINCIPAL */}
      <main className="px-4 pt-36 z-10 relative flex-1 max-w-5xl mx-auto w-full">
        
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 space-y-4">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#C41E25]"></div>
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="text-center py-20">
            <div className="inline-block p-4 bg-[#151A26] rounded-full mb-4">
               <BookOpen className="w-8 h-8 text-gray-600" />
            </div>
            <h3 className="text-lg font-medium text-white">Aucun résultat</h3>
            <p className="text-gray-500 text-sm mt-2">Essayez un autre terme de recherche.</p>
          </div>
        ) : (
          <div className="space-y-10">
            
            {/* SECTION À LA UNE (Premier article) */}
            {!searchTerm && filteredPosts.length > 0 && (
              <Link to={`/blog/${filteredPosts[0].slug}`} className="group block relative">
                <div className="relative aspect-[16/9] md:aspect-[21/9] rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/10">
                   {filteredPosts[0].image_url ? (
                     <img 
                       src={filteredPosts[0].image_url} 
                       className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                       alt={filteredPosts[0].title} 
                     />
                   ) : (
                     <div className="w-full h-full bg-[#1A1F2C]" />
                   )}
                   <div className="absolute inset-0 bg-gradient-to-t from-[#0A0D14] via-[#0A0D14]/40 to-transparent" />
                   
                   <div className="absolute bottom-0 left-0 p-6 md:p-8 w-full">
                      {filteredPosts[0].category && (
                        <span className="inline-block px-2 py-1 mb-3 text-[10px] font-bold uppercase tracking-wider bg-[#C41E25] text-white rounded-md shadow-lg shadow-red-900/20">
                          {filteredPosts[0].category}
                        </span>
                      )}
                      <h2 className="text-2xl md:text-4xl font-bold text-white mb-2 leading-tight group-hover:text-gray-100 transition-colors">
                        {filteredPosts[0].title}
                      </h2>
                      <div className="flex items-center gap-4 text-xs text-gray-300 font-medium">
                        {/* Affichage de la date (Seulement Jour/Mois/Année) */}
                        <span>{formatDate(filteredPosts[0].published_at)}</span>
                        
                        {/* Affichage du temps de lecture (AUCUNE unité) */}
                        {calculateReadTime(filteredPosts[0].content) && (
                            <span className="flex items-center gap-1">
                                {calculateReadTime(filteredPosts[0].content)} 
                            </span>
                        )}
                      </div>
                   </div>
                </div>
              </Link>
            )}

            {/* GRILLE DES AUTRES ARTICLES */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {(searchTerm ? filteredPosts : filteredPosts.slice(1)).map((post) => (
                <Link key={post.id} to={`/blog/${post.slug}`} className="group flex flex-col h-full bg-[#151A26]/50 border border-white/5 rounded-xl overflow-hidden hover:border-white/10 transition-all hover:bg-[#151A26]">
                  <div className="aspect-video w-full overflow-hidden relative">
                    {post.image_url ? (
                      <img 
                        src={post.image_url} 
                        alt={post.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                    ) : (
                      <div className="w-full h-full bg-[#1F2433] flex items-center justify-center">
                          <Flame className="w-10 h-10 text-gray-700" />
                      </div>
                    )}
                    {post.category && (
                        <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md text-[10px] font-bold px-2 py-1 rounded text-white border border-white/10 uppercase tracking-wide">
                            {post.category}
                        </div>
                    )}
                  </div>

                  <div className="p-5 flex flex-col flex-1">
                    <div className="flex items-center gap-3 text-[10px] font-medium text-gray-500 mb-3 uppercase tracking-wider">
                      {/* Affichage de la date (Seulement Jour/Mois/Année) */}
                      <span>{formatDate(post.published_at)}</span>
                      
                      {/* Affichage du temps de lecture (AUCUNE unité) */}
                      {calculateReadTime(post.content) && (
                          <>
                            <span className="w-1 h-1 rounded-full bg-[#C41E25]"></span>
                            <span>{calculateReadTime(post.content)}</span>
                          </>
                      )}
                    </div>

                    <h3 className="text-lg font-bold leading-snug text-white mb-3 group-hover:text-[#C41E25] transition-colors">
                      {post.title}
                    </h3>

                    {post.excerpt && (
                      <p className="text-sm text-gray-400 line-clamp-2 leading-relaxed mb-4 flex-1">
                          {post.excerpt}
                      </p>
                    )}
                    
                    <div className="flex items-center text-[#C41E25] text-xs font-bold uppercase tracking-wider mt-auto group-hover:translate-x-1 transition-transform">
                      Lire l'article <ChevronRight className="w-3 h-3 ml-1" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* NAVIGATION MOBILE (INTACTE) */}
     

    </div>
  );
};

export default Blog;
