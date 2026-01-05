import React from 'react';
import { 
  Star, TrendingUp, TrendingDown, MessageSquare,
  ThumbsUp, ThumbsDown, BarChart3
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

const trustpilotData = {
  overallScore: 4.6,
  totalReviews: 342,
  distribution: [
    { stars: 5, count: 245, percentage: 72 },
    { stars: 4, count: 58, percentage: 17 },
    { stars: 3, count: 22, percentage: 6 },
    { stars: 2, count: 10, percentage: 3 },
    { stars: 1, count: 7, percentage: 2 },
  ],
  recentTrend: 'up',
  monthlyChange: 0.2
};

const recentReviews = [
  { id: '1', author: 'Marie D.', company: 'BeautyBox Pro', score: 5, text: 'Excellent service, livraison rapide et produits de qualité!', date: '2026-01-04', responded: true },
  { id: '2', author: 'Jean M.', company: 'CosmetiCare', score: 4, text: 'Très satisfait dans l\'ensemble, quelques améliorations possibles sur le packaging.', date: '2026-01-03', responded: true },
  { id: '3', author: 'Sophie B.', company: 'Natural Glow', score: 2, text: 'Délai de livraison trop long, déçue du service client.', date: '2026-01-02', responded: false },
  { id: '4', author: 'Pierre L.', company: 'SkinCare Plus', score: 5, text: 'Partenaire de confiance depuis 2 ans, rien à redire.', date: '2026-01-01', responded: true },
];

const TrustpilotAnalytics = () => {
  const getStarColor = (score: number) => {
    if (score >= 4) return 'text-emerald-500';
    if (score >= 3) return 'text-yellow-500';
    return 'text-destructive';
  };

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
                  className={`h-8 w-8 ${star <= Math.floor(trustpilotData.overallScore) ? 'text-emerald-500 fill-emerald-500' : 'text-muted-foreground'}`} 
                />
              ))}
            </div>
            <p className="text-5xl font-bold">{trustpilotData.overallScore}</p>
            <p className="text-muted-foreground">sur 5</p>
            <div className="flex items-center gap-2 mt-4">
              {trustpilotData.recentTrend === 'up' ? (
                <Badge className="bg-emerald-500">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  +{trustpilotData.monthlyChange}
                </Badge>
              ) : (
                <Badge className="bg-destructive">
                  <TrendingDown className="h-3 w-3 mr-1" />
                  -{trustpilotData.monthlyChange}
                </Badge>
              )}
              <span className="text-sm text-muted-foreground">ce mois</span>
            </div>
            <p className="text-sm text-muted-foreground mt-4">{trustpilotData.totalReviews} avis</p>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Distribution des notes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {trustpilotData.distribution.map(item => (
                <div key={item.stars} className="flex items-center gap-4">
                  <div className="flex items-center gap-1 w-20">
                    <span className="font-medium">{item.stars}</span>
                    <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                  </div>
                  <Progress value={item.percentage} className="flex-1 h-3" />
                  <span className="text-sm text-muted-foreground w-16">{item.count} ({item.percentage}%)</span>
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
            {recentReviews.map(review => (
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
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TrustpilotAnalytics;
