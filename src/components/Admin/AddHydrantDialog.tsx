import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from '@/integrations/supabase/client';
import { Plus, Loader2, MapPin } from 'lucide-react';
import { toast } from 'sonner';

interface AddHydrantDialogProps {
    onSuccess: () => void;
}

export function AddHydrantDialog({ onSuccess }: AddHydrantDialogProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    
    // Champs obligatoires
    const [matricule, setMatricule] = useState('');
    const [city, setCity] = useState('');
    const [district, setDistrict] = useState('');
    
    // Champs optionnels
    const [avenue, setAvenue] = useState('');
    const [alley, setAlley] = useState('');
    const [details, setDetails] = useState('');

    const [flow, setFlow] = useState('');
    const [status, setStatus] = useState('functional');
    const [lat, setLat] = useState('');
    const [lng, setLng] = useState('');

    const getMyPosition = () => {
        if (!navigator.geolocation) return toast.error("GPS non supporté");
        navigator.geolocation.getCurrentPosition((pos) => {
            setLat(pos.coords.latitude.toString());
            setLng(pos.coords.longitude.toString());
            toast.success("Position GPS récupérée !");
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { error } = await supabase.rpc('create_hydrant', {
                p_matricule: matricule,
                p_flow: parseFloat(flow) || 0,
                p_status: status,
                p_lat: parseFloat(lat),
                p_lng: parseFloat(lng),
                p_city: city,
                p_district: district,
                p_avenue: avenue || null,
                p_alley: alley || null,
                p_details: details || null
            });

            if (error) throw error;

            toast.success("Point d'eau ajouté !");
            setOpen(false);
            // Reset
            setMatricule(''); setCity(''); setDistrict(''); setAvenue(''); setAlley(''); setDetails('');
            setFlow(''); setLat(''); setLng('');
            onSuccess();

        } catch (error: any) {
            console.error(error);
            toast.error("Erreur: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="mr-2 h-4 w-4" /> Nouveau PEI
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Ajouter un Point d'Eau</DialogTitle>
                </DialogHeader>
                
                <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                    {/* Identification */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label>Matricule *</Label>
                            <Input placeholder="ex: BH-100" value={matricule} onChange={e => setMatricule(e.target.value)} required />
                        </div>
                        <div className="grid gap-2">
                            <Label>État</Label>
                            <Select value={status} onValueChange={setStatus}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="functional">Opérationnel</SelectItem>
                                    <SelectItem value="maintenance">Maintenance</SelectItem>
                                    <SelectItem value="out_of_order">Hors Service</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Localisation 1 */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label>Ville *</Label>
                            <Input placeholder="ex: Brazzaville" value={city} onChange={e => setCity(e.target.value)} required />
                        </div>
                        <div className="grid gap-2">
                            <Label>Quartier *</Label>
                            <Input placeholder="ex: Poto-Poto" value={district} onChange={e => setDistrict(e.target.value)} required />
                        </div>
                    </div>

                    {/* Localisation 2 (Optionnel) */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label>Avenue (Optionnel)</Label>
                            <Input placeholder="ex: Av. de la Paix" value={avenue} onChange={e => setAvenue(e.target.value)} />
                        </div>
                        <div className="grid gap-2">
                            <Label>Ruelle (Optionnel)</Label>
                            <Input placeholder="ex: Ruelle 42" value={alley} onChange={e => setAlley(e.target.value)} />
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <Label>Repère / Détails (Optionnel)</Label>
                        <Textarea placeholder="ex: En face de la pharmacie, peinture écaillée..." value={details} onChange={e => setDetails(e.target.value)} />
                    </div>

                    <div className="grid gap-2">
                        <Label>Débit (L/s)</Label>
                        <Input type="number" placeholder="60" value={flow} onChange={e => setFlow(e.target.value)} />
                    </div>

                    {/* Coordonnées GPS */}
                    <div className="grid gap-2 border p-3 rounded-md bg-muted/20">
                        <div className="flex justify-between items-center mb-2">
                            <Label>Coordonnées GPS *</Label>
                            <Button type="button" variant="outline" size="sm" onClick={getMyPosition} className="h-6 text-xs">
                                <MapPin className="w-3 h-3 mr-1" /> Ma position
                            </Button>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <Input placeholder="Latitude" value={lat} onChange={e => setLat(e.target.value)} required />
                            <Input placeholder="Longitude" value={lng} onChange={e => setLng(e.target.value)} required />
                        </div>
                    </div>

                    <Button type="submit" disabled={loading} className="mt-2 w-full">
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Enregistrer
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    );
}