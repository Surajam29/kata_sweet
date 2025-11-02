import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, Package } from 'lucide-react';

interface Sweet {
  id: string;
  name: string;
  category: string;
  price: number;
  quantity: number;
  description: string | null;
  image_url: string | null;
}

interface SweetCardProps {
  sweet: Sweet;
  onPurchase: (sweet: Sweet) => void;
  isPurchasing: boolean;
}

export const SweetCard = ({ sweet, onPurchase, isPurchasing }: SweetCardProps) => {
  const isOutOfStock = sweet.quantity === 0;

  return (
    <Card className="overflow-hidden transition-all hover:shadow-lg hover:-translate-y-1">
      <div className="h-48 bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
        <Package className="w-20 h-20 text-primary/40" />
      </div>
      
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle className="text-xl">{sweet.name}</CardTitle>
          <Badge variant={isOutOfStock ? "destructive" : "secondary"}>
            {sweet.quantity} left
          </Badge>
        </div>
        <CardDescription>{sweet.description}</CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="flex items-center justify-between">
          <Badge variant="outline">{sweet.category}</Badge>
          <span className="text-2xl font-bold text-primary">
            Rs.{sweet.price.toFixed(2)}
          </span>
        </div>
      </CardContent>
      
      <CardFooter>
        <Button
          className="w-full"
          onClick={() => onPurchase(sweet)}
          disabled={isOutOfStock || isPurchasing}
        >
          <ShoppingCart className="mr-2 h-4 w-4" />
          {isOutOfStock ? 'Out of Stock' : 'Purchase'}
        </Button>
      </CardFooter>
    </Card>
  );
};
