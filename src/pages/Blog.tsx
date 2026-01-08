import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Search, X, BookOpen, Share2, Clock, Eye } from "lucide-react";
import MobileNav from "@/components/Layout/MobileNav";
import Navbar from "@/components/Layout/Navbar";

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
}

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
        .from("blog_posts")
        .select("*")
        .eq("status", "published")
        .order("published_at", { ascending: false });

      if (error) throw error;
      setPosts(data as BlogPost[]);
      setFilteredPosts(data as BlogPost[]);
    } catch (error) {
      console.error("Erreur chargement blog:", error);
      toast.error("Impossible de charger les articles.");
    } finally {
      setLoading(false);
    }
  };

  const calculateReadTime = (content: string | null) => {
    if (!content) return null;
    const text = content.replace(/<[^>]*>?/gm, "").replace(/\s+/g, " ").trim();
    if (text.length === 0) return null;
    const words = text.split(" ").length;
    if (words < 30) return null;
    return Math.ceil(words / 200);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "";
    return format(new Date(dateString), "d MMM yyyy", { locale: fr });
  };

  const handleShare = async (post: BlogPost, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const shareData = {
      title: post.title,
      text: post.excerpt || "Découvrez cet article",
      url: `${window.location.origin}/blog/${post.slug}`,
    };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {
        // cancelled
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareData.url);
        toast.success("Lien copié !");
      } catch {
        toast.error("Impossible de copier");
      }
    }
  };

  const featuredPost = !searchTerm && filteredPosts.length > 0 ? filteredPosts[0] : null;
  const otherPosts = searchTerm ? filteredPosts : filteredPosts.slice(1);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Desktop Navbar */}
      <div className="hidden md:block">
        <Navbar />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="px-5 py-6 max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold text-foreground mb-1">Blog</h1>
          <p className="text-sm text-muted-foreground mb-5">
            Actualités & conseils de prévention
          </p>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="search"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Rechercher un article..."
              className="w-full h-12 bg-card border border-border rounded-2xl pl-11 pr-11 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
              style={{ fontSize: "16px" }}
            />
            <AnimatePresence>
              {searchTerm && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-full bg-muted hover:bg-muted/80 transition-colors"
                >
                  <X className="w-4 h-4 text-muted-foreground" />
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto px-5 py-6 pb-28">
        <div className="max-w-2xl mx-auto">
          {loading ? (
            <div className="space-y-4">
              <div className="aspect-[16/9] bg-card rounded-2xl animate-pulse" />
              <div className="grid gap-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-32 bg-card rounded-2xl animate-pulse" />
                ))}
              </div>
            </div>
          ) : filteredPosts.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-20 text-center"
            >
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <BookOpen className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="text-foreground font-medium mb-1">Aucun article trouvé</p>
              <p className="text-sm text-muted-foreground">Essayez un autre terme</p>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-8"
            >
              {/* Featured post */}
              {featuredPost && (
                <Link to={`/blog/${featuredPost.slug}`} className="block group">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="relative aspect-[16/9] rounded-2xl overflow-hidden bg-card"
                  >
                    {featuredPost.image_url ? (
                      <img
                        src={featuredPost.image_url}
                        alt={featuredPost.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full bg-muted" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
                    
                    <div className="absolute bottom-0 left-0 right-0 p-6">
                      {featuredPost.category && (
                        <span className="inline-block px-3 py-1 mb-3 text-xs font-medium bg-primary text-primary-foreground rounded-full">
                          {featuredPost.category}
                        </span>
                      )}
                      <h2 className="text-xl font-bold text-foreground mb-2 line-clamp-2">
                        {featuredPost.title}
                      </h2>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>{formatDate(featuredPost.published_at)}</span>
                        {calculateReadTime(featuredPost.content) && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {calculateReadTime(featuredPost.content)} min
                          </span>
                        )}
                      </div>
                    </div>
                  </motion.div>
                </Link>
              )}

              {/* Other posts */}
              {otherPosts.length > 0 && (
                <div className="space-y-4">
                  {otherPosts.map((post, index) => (
                    <motion.div
                      key={post.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Link
                        to={`/blog/${post.slug}`}
                        className="flex gap-4 p-4 bg-card rounded-2xl border border-border hover:border-primary/30 transition-colors group"
                      >
                        {/* Thumbnail */}
                        <div className="w-24 h-24 rounded-xl overflow-hidden bg-muted flex-shrink-0">
                          {post.image_url ? (
                            <img
                              src={post.image_url}
                              alt={post.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <BookOpen className="w-6 h-6 text-muted-foreground" />
                            </div>
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
                          <div>
                            {post.category && (
                              <span className="text-[10px] font-medium text-primary uppercase tracking-wider">
                                {post.category}
                              </span>
                            )}
                            <h3 className="font-semibold text-foreground line-clamp-2 text-sm mt-1 group-hover:text-primary transition-colors">
                              {post.title}
                            </h3>
                          </div>

                          <div className="flex items-center justify-between mt-2">
                            <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                              <span>{formatDate(post.published_at)}</span>
                              {calculateReadTime(post.content) && (
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {calculateReadTime(post.content)} min
                                </span>
                              )}
                              <span className="flex items-center gap-1">
                                <Eye className="w-3 h-3" />
                                {post.views}
                              </span>
                            </div>
                            
                            <button
                              onClick={(e) => handleShare(post, e)}
                              className="p-2 -m-2 rounded-full hover:bg-muted transition-colors"
                            >
                              <Share2 className="w-4 h-4 text-muted-foreground" />
                            </button>
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </div>
      </main>

      <MobileNav />
    </div>
  );
};

export default Blog;
