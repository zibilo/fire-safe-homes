import { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";
import { motion, useScroll, useSpring } from "framer-motion";
import { 
  ArrowLeft, Clock, Eye, Share2,
  Home as HomeIcon, Users, BookOpen, Calendar
} from "lucide-react";
import { Button } from "@/components/ui/button";

// --- TYPES ---
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
}

const BlogPost = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Barre de progression de lecture
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  useEffect(() => {
    if (slug) fetchPost();
    window.scrollTo(0, 0);
  }, [slug]);

  const fetchPost = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('slug', slug)
        .eq('status', 'published')
        .single();

      if (error) throw error;

      if (data) {
        // Incrémentation des vues
        supabase.from('blog_posts').update({ views: (data.views || 0) + 1 }).eq('id', data.id).then();
      }
      
      setPost(data as BlogPost);
    } catch (error) {
      console.error('Error fetching post:', error);
      toast.error("Article introuvable");
      navigate("/blog");
    } finally {
      setLoading(false);
    }
  };

  // --- FONCTION DE PARTAGE ---
  const handleShare = async () => {
    if (!post) return;

    const shareData = {
      title: post.title,
      text: post.excerpt || "Découvrez cet article sur LE POMPIER",
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.log("Partage annulé ou erreur :", err);
      }
    } else {
      try {
        await navigator.clipboard.writeText(window.location.href);
        toast.success("Lien copié dans le presse-papier !");
      } catch (err) {
        toast.error("Impossible de copier le lien");
      }
    }
  };

  // --- CALCUL DU TEMPS DE LECTURE AMÉLIORÉ (NE RETOURNE PLUS 'min') ---
  const calculateReadTime = (content: string | null) => {
    if (!content) return null;
    // Nettoyer le HTML et les espaces
    const textOnly = content.replace(/<[^>]*>?/gm, '').trim();
    if (textOnly.length === 0) return null;

    const words = textOnly.split(/\s+/).length;
    
    // Si moins de 30 mots, on ne retourne rien
    if (words < 30) return null;

    const minutes = Math.ceil(words / 200);
    // Retourne seulement le nombre de minutes
    return minutes; 
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "";
    // Le format date reste Jour, Mois complet, Année (pas d'heure/minute)
    return format(new Date(dateString), "d MMMM yyyy", { locale: fr });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0D14] flex items-center justify-center">
         <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#C41E25]"></div>
      </div>
    );
  }

  if (!post) return null;

  // Stocke le temps de lecture (qui est maintenant un nombre ou null)
  const readTime = calculateReadTime(post.content);

  return (
    <div className="min-h-screen bg-[#0A0D14] text-white font-sans pb-28 relative selection:bg-[#C41E25] selection:text-white">
      
      <motion.div
        className="fixed top-0 left-0 right-0 h-1 bg-[#C41E25] z-[60] origin-left"
        style={{ scaleX }}
      />

      {/* --- HEADER NAVIGATION --- */}
      <motion.header 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="fixed top-0 left-0 right-0 z-50 bg-[#10141D]/80 backdrop-blur-lg border-b border-white/5 px-4 py-3 flex items-center justify-between shadow-lg"
      >
        <Button 
          variant="ghost" 
          size="sm"
          className="text-gray-300 hover:text-white hover:bg-white/5 -ml-2 gap-2"
          onClick={() => navigate("/blog")}
        >
          <ArrowLeft className="h-5 w-5" />
          <span className="hidden sm:inline">Retour</span>
        </Button>
        
        <span className="font-serif font-bold text-lg tracking-wider text-white">LE POMPIER</span>

        <div className="flex gap-2">
           <Button 
             variant="ghost" 
             size="icon" 
             className="text-gray-300 hover:text-white hover:bg-white/5"
             onClick={handleShare}
             aria-label="Partager cet article"
           >
             <Share2 className="h-5 w-5" />
           </Button>
        </div>
      </motion.header>

      {/* --- HERO SECTION --- */}
      <div className="relative w-full h-[65vh] md:h-[75vh] flex items-end">
        <div className="absolute inset-0 z-0">
          {post.image_url ? (
             <img 
               src={post.image_url} 
               alt={post.title} 
               className="w-full h-full object-cover"
             />
          ) : (
            <div className="w-full h-full bg-neutral-900" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0A0D14] via-[#0A0D14]/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0A0D14]/40 to-transparent" />
        </div>

        <div className="relative z-10 w-full max-w-4xl mx-auto px-6 pb-16 md:pb-20">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <div className="flex flex-wrap items-center gap-3 mb-6">
              {post.category && (
                <span className="px-3 py-1 rounded-md bg-[#C41E25] text-white text-xs font-bold uppercase tracking-wider shadow-lg shadow-red-900/20">
                  {post.category}
                </span>
              )}
              
              {/* Affichage conditionnel du temps de lecture (SEULEMENT LE CHIFFRE) */}
              {readTime && (
                <span className="px-3 py-1 rounded-md bg-white/10 backdrop-blur-md text-gray-200 text-xs font-medium flex items-center gap-1.5 border border-white/5">
                  <Clock className="w-3 h-3" />
                  {readTime}
                </span>
              )}
            </div>

            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white leading-[1.1] mb-6 drop-shadow-sm font-sans tracking-tight">
              {post.title}
            </h1>

            <div className="flex items-center gap-4 text-sm md:text-base text-gray-300">
               <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-full bg-gray-700 border border-white/10 flex items-center justify-center font-bold text-white overflow-hidden">
                    {post.author_name.charAt(0)}
                 </div>
                 <div className="flex flex-col">
                   <span className="font-semibold text-white">{post.author_name}</span>
                   <span className="text-xs text-gray-400 flex items-center gap-1">
                     <Calendar className="w-3 h-3" /> {formatDate(post.published_at)}
                   </span>
                 </div>
               </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* --- CONTENU DE L'ARTICLE --- */}
      <article className="relative z-20 px-4 md:px-0">
        <div className="max-w-3xl mx-auto">
          
          {post.excerpt && (
            <motion.div 
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="mb-12 border-l-4 border-[#C41E25] pl-6 py-2"
            >
              <p className="text-xl md:text-2xl text-gray-200 font-serif italic leading-relaxed">
                {post.excerpt}
              </p>
            </motion.div>
          )}

          <motion.div 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="
              prose prose-invert prose-lg md:prose-xl max-w-none 
              text-gray-300 font-serif leading-8 md:leading-10
              prose-headings:font-sans prose-headings:font-bold prose-headings:text-white prose-headings:tracking-tight
              prose-h2:mt-16 prose-h2:mb-6 prose-h2:text-3xl
              prose-h3:text-2xl prose-h3:text-[#C41E25]
              prose-p:mb-8 prose-p:text-gray-300/90
              prose-blockquote:border-l-[#C41E25] prose-blockquote:bg-[#151A26] prose-blockquote:py-6 prose-blockquote:px-8 prose-blockquote:rounded-r-lg prose-blockquote:not-italic
              prose-a:text-[#C41E25] prose-a:no-underline prose-a:border-b prose-a:border-[#C41E25]/30 prose-a:transition-all hover:prose-a:border-[#C41E25] hover:prose-a:text-white
              [&_.blog-image]:my-16
              [&_.blog-image]:w-full
              [&_.blog-image_img]:w-full
              [&_.blog-image_img]:rounded-lg
              [&_.blog-image_img]:shadow-2xl
              [&_.blog-image_img]:shadow-black/50
              [&_.blog-image_p]:text-center
              [&_.blog-image_p]:text-sm
              [&_.blog-image_p]:text-gray-500
              [&_.blog-image_p]:mt-3
              [&_.blog-image_p]:italic
              prose-li:marker:text-[#C41E25]
            "
            dangerouslySetInnerHTML={{ __html: post.content || "" }}
          />

          <div className="my-16 flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-[#C41E25] mx-1"></div>
            <div className="w-2 h-2 rounded-full bg-[#C41E25] mx-1 opacity-50"></div>
            <div className="w-2 h-2 rounded-full bg-[#C41E25] mx-1 opacity-25"></div>
          </div>

          <div className="flex items-center justify-between p-6 bg-[#151A26] rounded-xl border border-white/5">
             <div className="flex items-center gap-3 text-gray-400">
                <Eye className="w-5 h-5" />
                <span className="font-medium">{post.views} lectures</span>
             </div>
             <Button 
              variant="outline" 
              className="border-[#C41E25] text-[#C41E25] hover:bg-[#C41E25] hover:text-white transition-colors"
              onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})}
            >
              Remonter
            </Button>
          </div>

        </div>
      </article>

      {/* --- NAVIGATION MOBILE --- */}
     

    </div>
  );
};

export default BlogPost;
