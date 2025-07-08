
'use client';

import { useEffect, useState, useMemo }from 'react';
import { suggestItems, SuggestItemsInput } from '@/ai/flows/suggest-items';
import type { MenuItem } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Sparkles, Lightbulb } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

interface SmartSuggestionsProps {
  timeOfDay: string;
  currentOrderItems: Pick<MenuItem, 'name'>[]; // This should be a combined list of cart + active KDS items
  onAddSuggestedItem: (itemName: string) => void;
  menuItems: MenuItem[]; // All available menu items for lookup
  isOrderActive: boolean; // True if any KDS order has been sent (even if cart is also being built)
}

export function SmartSuggestions({ 
  timeOfDay, 
  currentOrderItems, 
  onAddSuggestedItem, 
  menuItems, 
  isOrderActive 
}: SmartSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const previousOrdersText = useMemo(() => {
    return currentOrderItems.map(item => item.name).join(', ') || 'None';
  }, [currentOrderItems]);

  const availableMenuItemsText = useMemo(() => {
    return menuItems.map(item => item.name).join(', ');
  }, [menuItems]);


  useEffect(() => {
    if (!timeOfDay || !availableMenuItemsText) { 
        setSuggestions([]);
        return;
    }

    const fetchSuggestions = async () => {
      setIsLoading(true);
      try {
        const input: SuggestItemsInput = {
          timeOfDay,
          previousOrders: previousOrdersText,
          availableMenuItems: availableMenuItemsText,
        };
        const result = await suggestItems(input);
        if (result && result.suggestions) {
          const uniqueSuggestions = Array.from(new Set(
            result.suggestions.split(',')
              .map(s => s.trim())
              .filter(s => s.length > 0 && menuItems.some(mi => mi.name.toLowerCase() === s.toLowerCase())) // Ensure suggested item is in menu
          ));
          setSuggestions(uniqueSuggestions);
        } else {
          setSuggestions([]);
        }
      } catch (error) {
        console.error('Error fetching suggestions:', error);
        toast({
          title: "Suggestion Error",
          description: "Could not fetch smart suggestions at this time.",
          variant: "destructive",
        });
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSuggestions();
    
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeOfDay, previousOrdersText, availableMenuItemsText, toast]); // Refetch if essential data changes

  const handleAddSuggestion = (itemName: string) => {
    const suggestedItem = menuItems.find(menuItem => menuItem.name.toLowerCase() === itemName.toLowerCase());
    if (suggestedItem) {
      onAddSuggestedItem(suggestedItem.name); 
    } else {
       toast({
          title: "Item Not Found",
          description: `Could not find "${itemName}" in the menu. This shouldn't happen.`, // Should be rare now
          variant: "destructive",
        });
    }
  };

  if (!timeOfDay) { 
    return null;
  }
  
  return (
    <Card className="mb-8 bg-secondary/50 shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center text-xl text-accent">
          <Lightbulb className="mr-2 h-6 w-6" />
          Smart Suggestions
        </CardTitle>
        <CardDescription className="text-muted-foreground">
          {isOrderActive ? `You have an active order. Here are some ideas to add from our menu:` : `Based on ${timeOfDay} and your current selections, from our menu.`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center h-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="ml-2 text-muted-foreground">Fetching ideas...</p>
          </div>
        ) : suggestions.length > 0 ? (
          <ul className="space-y-2">
            {suggestions.map((suggestion, index) => (
              <li key={index} className="flex justify-between items-center p-2 rounded-md hover:bg-background transition-colors">
                <span className="flex items-center text-foreground">
                  <Sparkles className="h-4 w-4 mr-2 text-primary" /> {suggestion}
                </span>
                <Button variant="outline" size="sm" onClick={() => handleAddSuggestion(suggestion)}>
                  Add to Cart
                </Button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted-foreground">No specific suggestions right now, explore the menu!</p>
        )}
      </CardContent>
    </Card>
  );
}
