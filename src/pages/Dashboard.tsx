import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SweetCard } from '@/components/SweetCard';
import { AdminPanel } from '@/components/AdminPanel';
import { toast } from 'sonner';
import { Search, LogOut, Candy, ShieldCheck } from 'lucide-react';

interface Sweet {
  id: string;
  name: string;
  category: string;
  price: number;
  quantity: number;
  description: string | null;
  image_url: string | null;
}

const Dashboard = () => {
  const { user, isAdmin, signOut, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [sweets, setSweets] = useState<Sweet[]>([]);
  const [filteredSweets, setFilteredSweets] = useState<Sweet[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchSweets();
    }
  }, [user]);

  useEffect(() => {
    filterSweets();
  }, [searchQuery, sweets]);

  const fetchSweets = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('sweets')
      .select('*')
      .order('name');

    if (error) {
      toast.error('Failed to load sweets');
    } else {
      setSweets(data || []);
    }
    setLoading(false);
  };

  const filterSweets = () => {
    if (!searchQuery.trim()) {
      setFilteredSweets(sweets);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = sweets.filter(
      (sweet) =>
        sweet.name.toLowerCase().includes(query) ||
        sweet.category.toLowerCase().includes(query) ||
        sweet.description?.toLowerCase().includes(query)
    );
    setFilteredSweets(filtered);
  };

  const handlePurchase = async (sweet: Sweet) => {
    if (!user) return;

    setIsPurchasing(true);

    // Check current quantity
    const { data: currentSweet } = await supabase
      .from('sweets')
      .select('quantity')
      .eq('id', sweet.id)
      .single();

    if (!currentSweet || currentSweet.quantity === 0) {
      toast.error('This sweet is out of stock');
      setIsPurchasing(false);
      return;
    }

    // Create purchase record
    const { error: purchaseError } = await supabase.from('purchases').insert({
      user_id: user.id,
      sweet_id: sweet.id,
      quantity: 1,
      total_price: sweet.price,
    });

    if (purchaseError) {
      toast.error('Failed to complete purchase');
      setIsPurchasing(false);
      return;
    }

    // Update sweet quantity
    const { error: updateError } = await supabase
      .from('sweets')
      .update({ quantity: currentSweet.quantity - 1 })
      .eq('id', sweet.id);

    if (updateError) {
      toast.error('Failed to update inventory');
    } else {
      toast.success(`Purchased ${sweet.name}!`);
      fetchSweets();
    }

    setIsPurchasing(false);
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Candy className="w-16 h-16 text-primary animate-bounce mx-auto mb-4" />
          <p className="text-muted-foreground">Loading sweet shop...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/5">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <Candy className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  Sweet Shop
                </h1>
                {isAdmin && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <ShieldCheck className="w-3 h-3" />
                    Admin
                  </div>
                )}
              </div>
            </div>
            <Button variant="outline" onClick={signOut}>
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search sweets by name, category, or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSweets.map((sweet) => (
            <SweetCard
              key={sweet.id}
              sweet={sweet}
              onPurchase={handlePurchase}
              isPurchasing={isPurchasing}
            />
          ))}
        </div>

        {filteredSweets.length === 0 && (
          <div className="text-center py-12">
            <Candy className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No sweets found</p>
          </div>
        )}

        {isAdmin && <AdminPanel sweets={sweets} onSweetsChange={fetchSweets} />}
      </main>
    </div>
  );
};

export default Dashboard;
