import React from 'react';
import { 
  Star, TrendingUp, TrendingDown, MessageSquare,
  Loader2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useUserAccountStats, useUserAccounts } from '@/hooks/useLifecycle';

const TrustpilotAnalytics = () => {
  const { data: stats, isLoading } = useUserAccountStats();
  const { data: accounts } = useUserAccounts({ limit: 10 });

  // Calculate distribution from real data
  const distribution = accounts?.reduce((acc, account) => {
    const rating = Math.round(account.trustpilot_rating || 0);
    if (rating >= 1 && rating <= 5) {
      acc[rating - 1].count++;
    }
    return acc;
  }, [
    { stars: 5, count: 0 },
    { stars: 4, count: 0 },
    { stars: 3, count: 0 },
    { stars: 2, count: 0 },
    { stars: 1, count: 0 },
  ]) || [
    { stars: 5, count: 0 },
    { stars: 4, count: 0 },
    { stars: 3, count: 0 },
    { stars: 2, count: 0 },
    { stars: 1, count: 0 },
  ];

  const totalReviews = distribution.reduce((sum, d) => sum + d.count, 0);
  const distributionWithPercentage = distribution.map(d => ({
    ...d,
    percentage: totalReviews > 0 ? Math.round((d.count / totalReviews) * 100) : 0,
  })).reverse();

  const overallScore = stats?.averageRating || 0;

  // Mock recent reviews from accounts
  const recentReviews = accounts?.slice(0, 4).map((account, i) => ({
    id: account.id,
    author: account.contact_name || 'Anonyme',
    company: account.company_name,
    score: account.trustpilot_rating || 3,
    text: account.notes || 'Pas de commentaire',
    date: account.created_at?.split('T')[0] || 'N/A',
    responded: i % 2 === 0,
  })) || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <Star className="h-8 w-8 text-primary fill-primary" />
            Trustpilot Analytics
          </h1>
          <p className="text-muted-foreground mt-1">Avis négatifs, tendances, réputation</p>
        </div>
      </div>

      {/* Main Score */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-1">
          <CardContent className="p-6 flex flex-col items-center justify-center">
            <div className="flex items-center gap-1 mb-2">
              {[1, 2, 3, 4, 5].map(star => (
                <Star 
                  key={star} 
                  className={`h-8 w-8 ${star <= Math.floor(overallScore) ? 'text-emerald-500 fill-emerald-500' : 'text-muted-foreground'}`} 
                />
              ))}
            </div>
            <p className="text-5xl font-bold">{overallScore.toFixed(1)}</p>
            <p className="text-muted-foreground">sur 5</p>
            <div className="flex items-center gap-2 mt-4">
              {overallScore >= 4 ? (
                <Badge className="bg-emerald-500">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  Excellent
                </Badge>
              ) : overallScore >= 3 ? (
                <Badge className="bg-yellow-500">
                  Moyen
                </Badge>
              ) : (
                <Badge className="bg-destructive">
                  <TrendingDown className="h-3 w-3 mr-1" />
                  À améliorer
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-4">{totalReviews} avis</p>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Distribution des notes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {distributionWithPercentage.map(item => (
                <div key={item.stars} className="flex items-center gap-4">
                  <div className="flex items-center gap-1 w-20">
                    <span className="font-medium">{item.stars}</span>
                    <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                  </div>
                  <Progress value={item.percentage} className="flex-1 h-3" />
                  <span className="text-sm text-muted-foreground w-20">{item.count} ({item.percentage}%)</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Reviews */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Avis Récents
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentReviews.length > 0 ? (
              recentReviews.map(review => (
                <div key={review.id} className={`p-4 border rounded-lg ${review.score < 3 ? 'border-destructive bg-destructive/5' : ''}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map(star => (
                            <Star 
                              key={star} 
                              className={`h-4 w-4 ${star <= review.score ? 'text-yellow-500 fill-yellow-500' : 'text-muted-foreground'}`} 
                            />
                          ))}
                        </div>
                        <span className="font-medium">{review.author}</span>
                        <Badge variant="outline">{review.company}</Badge>
                      </div>
                      <p className="text-sm">{review.text}</p>
                      <p className="text-xs text-muted-foreground mt-2">{review.date}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {review.responded ? (
                        <Badge className="bg-emerald-500">Répondu</Badge>
                      ) : (
                        <Badge variant="destructive">À répondre</Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-muted-foreground py-8">
                Aucun avis disponible
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TrustpilotAnalytics;
