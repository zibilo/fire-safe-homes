import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, Pencil, Trash2, Image as ImageIcon, Loader2, 
  ArrowUp, ArrowDown, Type, Video, X
} from "lucide-react";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

// --- TYPES ---
type SectionType = 'text' | 'image' | 'video';

interface Section {
  id: string;
  type: SectionType;
  content: string;
  caption?: string;
  file?: File | null;
}

// -------------------------------------------------------------
// ✅ FONCTION D'ENVOI DE NOTIFICATION PUSH
// -------------------------------------------------------------
const sendPushNotification = async (titreArticle: string, slug: string) => {
  const ONESIGNAL_APP_ID = "2e492b85-f706-48ae-9943-dda545a9792c"; // Votre ID
  const ONESIGNAL_API_KEY = "os_v2_app_fzesxbpxazek5gkd3wsulklzfqf2dcrzifuugde4jq5rmzypsktchiroq7ry4mjg4fyrs24ws4rmbhlamzy4kpvpiq3yimewnpqlupi"; // Clé fournie

  const options = {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Basic ${ONESIGNAL_API_KEY}`,
    },
    body: JSON.stringify({
      app_id: ONESIGNAL_APP_ID,
      included_segments: ['Total Subscriptions'], // Envoie à tous les abonnés
      headings: { en: "Nouvel Article publié !" },
      contents: { en: titreArticle },
      // L'URL de votre site (dynamique selon où vous êtes)
      url: `${window.location.origin}/blog/${slug}` 
    })
  };

  try {
    const response = await fetch('https://onesignal.com/api/v1/notifications', options);
    const result = await response.json();
    console.log("🔔 Résultat notification:", result);
  } catch (err) {
    console.error("❌ Erreur envoi notif:", err);
  }
};

// --- COMPOSANT PRINCIPAL ---
export default function BlogManagement() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);

  // États Globaux
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [category, setCategory] = useState("Prévention");
  const [status, setStatus] = useState("draft");
  
  // Image de couverture
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);

  // Sections
  const [sections, setSections] = useState<Section[]>([]);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    const { data } = await supabase.from('blog_posts').select('*').order('created_at', { ascending: false });
    if (data) setPosts(data);
    setLoading(false);
  };

  // --- LOGIQUE SECTIONS ---
  const addSection = (type: SectionType) => {
    const uniqueId = Date.now().toString() + Math.random().toString(36).substring(2);
    
    const newSection: Section = {
      id: uniqueId,
      type,
      content: '',
      caption: '',
      file: null
    };
    setSections((prev) => [...prev, newSection]);
  };

  const removeSection = (id: string) => {
    setSections((prev) => prev.filter(s => s.id !== id));
  };

  const moveSection = (index: number, direction: 'up' | 'down') => {
    setSections((prev) => {
      const newSections = [...prev];
      if (direction === 'up' && index > 0) {
        [newSections[index], newSections[index - 1]] = [newSections[index - 1], newSections[index]];
      } else if (direction === 'down' && index < newSections.length - 1) {
        [newSections[index], newSections[index + 1]] = [newSections[index + 1], newSections[index]];
      }
      return newSections;
    });
  };

  const updateSection = (id: string, field: keyof Section, value: any) => {
    setSections((prev) => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  // --- LOGIQUE UPLOAD ---
  const uploadFileToSupabase = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `${fileName}`;
    const { error } = await supabase.storage.from('blog-images').upload(filePath, file);
    if (error) throw error;
    const { data } = supabase.storage.from('blog-images').getPublicUrl(filePath);
    return data.publicUrl;
  };

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
  };

  const handleSectionImageChange = (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    updateSection(id, 'file', file);
    updateSection(id, 'content', URL.createObjectURL(file));
  };

  // --- SUBMIT ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);

    try {
      let finalCoverUrl = coverPreview;
      if (coverFile) {
        finalCoverUrl = await uploadFileToSupabase(coverFile);
      }

      let finalHtmlContent = "";
      
      const safeSections = sections || [];

      for (const section of safeSections) {
        let contentUrl = section.content;

        if (section.type === 'image' && section.file) {
          contentUrl = await uploadFileToSupabase(section.file);
        }

        if (section.type === 'text') {
          finalHtmlContent += `<div class="blog-text mb-6">${section.content}</div>`;
        } else if (section.type === 'image') {
          finalHtmlContent += `
            <div class="blog-image mb-8">
              <img src="${contentUrl}" alt="Illustration" class="w-full rounded-lg shadow-md mb-2 object-cover" />
              ${section.caption ? `<p class="text-sm text-gray-500 italic text-center border-l-4 border-blue-500 pl-3 py-1 bg-gray-50">${section.caption}</p>` : ''}
            </div>
          `;
        } else if (section.type === 'video') {
           let videoId = section.content;
           try {
             if(section.content.includes('v=')) videoId = section.content.split('v=')[1].split('&')[0];
             else if(section.content.includes('youtu.be/')) videoId = section.content.split('youtu.be/')[1];
           } catch(e) { console.log(e) }

           finalHtmlContent += `
            <div class="blog-video mb-8 aspect-video rounded-lg overflow-hidden shadow-lg">
              <iframe width="100%" height="100%" src="https://www.youtube.com/embed/${videoId}" frameborder="0" allowfullscreen></iframe>
            </div>
           `;
        }
      }

      const { data: { user } } = await supabase.auth.getUser();

      // Génération du Slug
      const slug = title.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');

      const postData = {
        title,
        slug,
        excerpt,
        content: finalHtmlContent,
        category,
        status,
        image_url: finalCoverUrl,
        published_at: status === 'published' ? new Date().toISOString() : null,
        author_name: user?.email?.split('@')[0] || 'Admin', 
        author_id: user?.id
      };

      if (editingId) {
        await supabase.from('blog_posts').update(postData).eq('id', editingId);
        toast.success("Article mis à jour !");
      } else {
        await supabase.from('blog_posts').insert([postData]);
        toast.success("Article créé !");

        // ----------------------------------------------------------------
        // ✅ ENVOI DE LA NOTIFICATION PUSH (Uniquement lors de la création)
        // ----------------------------------------------------------------
        // On n'envoie la notif que si l'article est "published" (public)
        if (status === 'published') {
            await sendPushNotification(title, slug);
            toast.info("Notification envoyée aux abonnés 🔔");
        }
      }

      setIsDialogOpen(false);
      resetForm();
      fetchPosts();

    } catch (error: any) {
      console.error(error);
      toast.error("Erreur : " + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer cet article ?")) return;
    await supabase.from('blog_posts').delete().eq('id', id);
    fetchPosts();
    toast.success("Article supprimé");
  };

  const openEdit = (post: any) => {
    setEditingId(post.id);
    setTitle(post.title);
    setExcerpt(post.excerpt || "");
    setCategory(post.category || "Prévention");
    setStatus(post.status || "draft");
    setCoverPreview(post.image_url);
    
    setSections([{
        id: 'legacy-content',
        type: 'text',
        content: post.content || '',
        caption: ''
    }]);
    
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setEditingId(null);
    setTitle(""); setExcerpt(""); setCategory("Prévention"); setStatus("draft");
    setCoverFile(null); setCoverPreview(null);
    setSections([]);
  };

  // --- RENDER D'UNE SECTION ---
  const renderSectionInput = (section: Section, index: number) => {
    return (
      <div key={section.id} className="relative group border border-white/10 rounded-xl p-4 bg-[#262B39] shadow-md hover:border-[#C41E25]/50 transition-all mb-4">
        
        {/* Barre d'outils de la section */}
        <div className="absolute top-2 right-2 flex gap-1 opacity-100 bg-[#1F2433] p-1 rounded-md shadow-sm z-10 border border-white/10">
          <Button type="button" variant="ghost" size="icon" className="h-7 w-7 hover:bg-white/10" disabled={index === 0} onClick={() => moveSection(index, 'up')}>
            <ArrowUp className="w-4 h-4 text-gray-400" />
          </Button>
          <Button type="button" variant="ghost" size="icon" className="h-7 w-7 hover:bg-white/10" disabled={index === sections.length - 1} onClick={() => moveSection(index, 'down')}>
            <ArrowDown className="w-4 h-4 text-gray-400" />
          </Button>
          <Button type="button" variant="ghost" size="icon" className="h-7 w-7 hover:bg-red-900/50" onClick={() => removeSection(section.id)}>
            <Trash2 className="w-4 h-4 text-red-500" />
          </Button>
        </div>

        <div className="mb-2">
            <Badge variant="outline" className="uppercase text-[10px] tracking-widest border-white/10 text-gray-300">
                {section.type === 'text' && <><Type className="w-3 h-3 mr-1"/> Texte</>}
                {section.type === 'image' && <><ImageIcon className="w-3 h-3 mr-1"/> Image</>}
                {section.type === 'video' && <><Video className="w-3 h-3 mr-1"/> Vidéo</>}
            </Badge>
        </div>

        <div className="pt-2">
            {section.type === 'text' && (
                <div className="text-black"> 
                    <ReactQuill 
                        theme="snow" 
                        value={section.content} 
                        onChange={(val) => updateSection(section.id, 'content', val)}
                        placeholder="Écrivez votre paragraphe ici..."
                        className="bg-gray-100 rounded-md"
                    />
                </div>
            )}

            {section.type === 'image' && (
                <div className="flex flex-col gap-3">
                    <div className="flex items-start gap-4">
                        {section.content ? (
                            <img src={section.content} alt="Preview" className="w-32 h-32 object-cover rounded-md border border-white/10 bg-black/20" />
                        ) : (
                            <div className="w-32 h-32 bg-[#1A1F2C] rounded-md flex items-center justify-center border-dashed border-2 border-white/20 text-gray-500">
                                <ImageIcon className="w-8 h-8" />
                            </div>
                        )}
                        <div className="flex-1">
                            <Input 
                                type="file" 
                                accept="image/*" 
                                onChange={(e) => handleSectionImageChange(section.id, e)} 
                                className="bg-[#1A1F2C] border-white/10 text-white file:text-white file:bg-[#C41E25] file:border-0 file:rounded-md file:px-2 file:py-1 file:mr-2 file:text-xs hover:file:bg-[#a0181e]"
                            />
                            <p className="text-xs text-gray-400 mt-1">Cliquez pour choisir une image.</p>
                        </div>
                    </div>
                    <div className="mt-2">
                        <Label className="text-xs text-gray-400">Texte sous l'image (Légende)</Label>
                        <Textarea 
                            value={section.caption} 
                            onChange={(e) => updateSection(section.id, 'caption', e.target.value)} 
                            placeholder="Décrivez cette image..." 
                            className="h-16 mt-1 bg-[#1A1F2C] border-white/10 text-white placeholder:text-gray-600"
                        />
                    </div>
                </div>
            )}

            {section.type === 'video' && (
                <div className="space-y-2">
                    <Label className="text-xs text-gray-400">Lien YouTube</Label>
                    <Input 
                        placeholder="https://www.youtube.com/watch?v=..." 
                        value={section.content}
                        onChange={(e) => updateSection(section.id, 'content', e.target.value)}
                        className="bg-[#1A1F2C] border-white/10 text-white placeholder:text-gray-600"
                    />
                    {section.content && (
                        <div className="aspect-video bg-black rounded-md overflow-hidden mt-2 opacity-80 border border-white/10">
                            <iframe 
                                className="w-full h-full pointer-events-none" 
                                src={`https://www.youtube.com/embed/${section.content.includes('v=') ? section.content.split('v=')[1].split('&')[0] : ''}`} 
                            />
                        </div>
                    )}
                </div>
            )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#10141D] text-white p-6 space-y-6">
      
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Gestion du Blog</h1>
        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if(!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="bg-[#C41E25] hover:bg-[#a0181e] text-white shadow-lg shadow-red-900/20">
              <Plus className="mr-2 h-4 w-4" /> Nouvel Article
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto bg-[#1F2433] border-white/10 text-white">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-white">{editingId ? "Modifier l'article" : "Créer un article"}</DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-6 mt-4 pb-20">
              
              <Card className="bg-[#262B39] border-white/10">
                <CardContent className="pt-6 grid gap-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-gray-300">Titre</Label>
                            <Input 
                                value={title} 
                                onChange={e => setTitle(e.target.value)} 
                                required 
                                placeholder="Titre de l'article" 
                                className="bg-[#1A1F2C] border-white/10 text-white placeholder:text-gray-600"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-gray-300">Catégorie</Label>
                            <Select value={category} onValueChange={setCategory}>
                                <SelectTrigger className="bg-[#1A1F2C] border-white/10 text-white">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-[#1A1F2C] border-white/10 text-white">
                                    <SelectItem value="Prévention">Prévention</SelectItem>
                                    <SelectItem value="Intervention">Intervention</SelectItem>
                                    <SelectItem value="Équipement">Équipement</SelectItem>
                                    <SelectItem value="Vie de la caserne">Vie de la caserne</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    
                    <div className="space-y-2 border-t border-white/10 pt-4">
                        <Label className="text-gray-300">Image de couverture (Principale)</Label>
                        <div className="flex items-center gap-4">
                            {coverPreview ? (
                                <img src={coverPreview} className="w-20 h-14 rounded object-cover border border-white/10" />
                            ) : (
                                <div className="w-20 h-14 bg-[#1A1F2C] rounded border border-white/10 flex items-center justify-center">
                                    <ImageIcon className="text-gray-600 w-6 h-6"/>
                                </div>
                            )}
                            <Input 
                                type="file" 
                                accept="image/*" 
                                onChange={handleCoverChange} 
                                className="bg-[#1A1F2C] border-white/10 text-white file:text-white file:bg-[#C41E25] file:border-0 file:rounded-md file:px-2 file:py-1 file:mr-2 file:text-xs hover:file:bg-[#a0181e]"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-gray-300">Extrait (Résumé)</Label>
                        <Textarea 
                            value={excerpt} 
                            onChange={e => setExcerpt(e.target.value)} 
                            placeholder="Résumé pour la liste..." 
                            className="h-14 bg-[#1A1F2C] border-white/10 text-white placeholder:text-gray-600"
                        />
                    </div>
                </CardContent>
              </Card>

              {/* SECTIONS */}
              <div className="space-y-4">
                  <div className="flex items-center justify-between">
                      <Label className="text-lg font-bold text-white">Contenu de l'article</Label>
                      <span className="text-xs text-gray-400">Ajoutez des blocs pour construire votre article</span>
                  </div>

                  <div className="min-h-[200px] space-y-4">
                      {sections && sections.length === 0 && (
                          <div className="text-center py-10 border-2 border-dashed border-white/10 rounded-xl text-gray-500 bg-[#262B39]/50">
                              Commencez par ajouter du texte ou une image ci-dessous
                          </div>
                      )}
                      {sections && sections.map((section, index) => renderSectionInput(section, index))}
                  </div>

                  <div className="grid grid-cols-3 gap-2 sticky bottom-0 bg-[#1F2433]/90 backdrop-blur-md p-4 border-t border-white/10 shadow-2xl rounded-xl z-20">
                      <Button type="button" variant="outline" onClick={() => addSection('text')} className="border-white/10 hover:bg-white/10 text-white hover:text-white">
                          <Type className="w-4 h-4 mr-2"/> Ajouter Texte
                      </Button>
                      <Button type="button" variant="outline" onClick={() => addSection('image')} className="border-white/10 hover:bg-white/10 text-white hover:text-white">
                          <ImageIcon className="w-4 h-4 mr-2"/> Ajouter Image
                      </Button>
                      <Button type="button" variant="outline" onClick={() => addSection('video')} className="border-white/10 hover:bg-white/10 text-white hover:text-white">
                          <Video className="w-4 h-4 mr-2"/> Ajouter Vidéo
                      </Button>
                  </div>
              </div>
              
              <div className="mt-8 flex justify-end gap-3 sticky bottom-4 z-30">
                 <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="border-white/10 text-gray-400 hover:text-white">
                    Annuler
                 </Button>
                 
                 <div className="flex items-center gap-2 bg-[#262B39] p-1 rounded-md border border-white/10 mr-4">
                    <Button 
                        type="button" 
                        variant={status === 'draft' ? 'secondary' : 'ghost'} 
                        size="sm"
                        onClick={() => setStatus('draft')}
                        className="text-xs"
                    >
                        Brouillon
                    </Button>
                    <Button 
                        type="button" 
                        variant={status === 'published' ? 'default' : 'ghost'} 
                        size="sm"
                        onClick={() => setStatus('published')}
                        className={status === 'published' ? 'bg-green-600 hover:bg-green-700 text-xs' : 'text-xs text-gray-400'}
                    >
                        Publié
                    </Button>
                 </div>

                 <Button type="submit" className="bg-[#C41E25] hover:bg-[#a0181e] min-w-[150px]" disabled={uploading}>
                    {uploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {editingId ? "Mettre à jour" : "Créer l'article"}
                 </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* TABLEAU */}
      <Card className="bg-[#1F2433] border-white/10 text-white">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-[#262B39]">
              <TableRow className="border-white/10 hover:bg-transparent">
                <TableHead className="text-gray-400 w-[80px]">Image</TableHead>
                <TableHead className="text-gray-400">Titre</TableHead>
                <TableHead className="text-gray-400">Catégorie</TableHead>
                <TableHead className="text-gray-400">Date</TableHead>
                <TableHead className="text-gray-400">Statut</TableHead>
                <TableHead className="text-right text-gray-400">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-gray-400">Chargement...</TableCell>
                </TableRow>
              ) : posts.length === 0 ? (
                <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-gray-500">Aucun article trouvé.</TableCell>
                </TableRow>
              ) : (
                posts.map((post) => (
                  <TableRow key={post.id} className="border-white/5 hover:bg-white/5 transition-colors">
                    <TableCell>
                        <div className="w-12 h-8 rounded bg-[#10141D] overflow-hidden">
                            {post.image_url ? (
                                <img src={post.image_url} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-600">
                                    <ImageIcon className="w-4 h-4" />
                                </div>
                            )}
                        </div>
                    </TableCell>
                    <TableCell className="font-medium text-white">{post.title}</TableCell>
                    <TableCell>
                        <Badge variant="outline" className="border-white/10 text-gray-300 bg-white/5">
                            {post.category}
                        </Badge>
                    </TableCell>
                    <TableCell className="text-gray-400 text-sm">
                        {new Date(post.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                        <Badge className={post.status === 'published' ? "bg-green-900/50 text-green-400 hover:bg-green-900/60" : "bg-yellow-900/50 text-yellow-400 hover:bg-yellow-900/60"}>
                            {post.status === 'published' ? 'Publié' : 'Brouillon'}
                        </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(post)} className="text-blue-400 hover:text-blue-300 hover:bg-blue-900/20">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(post.id)} className="text-red-400 hover:text-red-300 hover:bg-red-900/20">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>5
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
