
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { checkNetworkStatus, invalidateAllQueries, clearQueryCache, queryClient, debugQuery } from '@/config/queryClient';
import { RefreshCw, Trash2, Wifi, WifiOff, Bug } from 'lucide-react';

const DebugPanel: React.FC = () => {
  const [isOnline, setIsOnline] = React.useState(navigator.onLine);
  const [queryCache, setQueryCache] = React.useState<any[]>([]);

  const updateNetworkStatus = () => {
    setIsOnline(navigator.onLine);
    checkNetworkStatus();
  };

  const updateQueryCache = () => {
    try {
      const cache = queryClient.getQueryCache();
      const queries = cache.getAll();
      const queryInfo = queries.map(query => ({
        queryKey: query.queryKey,
        state: query.state.status,
        dataUpdatedAt: query.state.dataUpdatedAt,
        isStale: query.isStale(),
        observers: query.getObserversCount(),
        error: query.state.error?.message,
        data: query.state.data ? 'Has data' : 'No data',
      }));
      setQueryCache(queryInfo);
      console.log('Query cache updated:', queryInfo);
    } catch (error) {
      console.error('Error updating query cache:', error);
    }
  };

  const forceRefetchAll = () => {
    console.log('Force refetching all queries...');
    queryClient.refetchQueries();
  };

  const debugSpecificQuery = (queryKey: string[]) => {
    debugQuery(queryKey);
  };

  React.useEffect(() => {
    updateNetworkStatus();
    updateQueryCache();

    const interval = setInterval(updateQueryCache, 3000);
    return () => clearInterval(interval);
  }, []);

  React.useEffect(() => {
    const handleOnline = () => updateNetworkStatus();
    const handleOffline = () => updateNetworkStatus();

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <Card className="w-full max-w-4xl mx-auto mt-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          React Query Debug Panel
          {isOnline ? (
            <Wifi className="h-5 w-5 text-green-500" />
          ) : (
            <WifiOff className="h-5 w-5 text-red-500" />
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2 flex-wrap">
          <Button onClick={updateNetworkStatus} variant="outline" size="sm">
            Verificar Rede
          </Button>
          <Button onClick={forceRefetchAll} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refetch All
          </Button>
          <Button onClick={invalidateAllQueries} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Invalidar Todas
          </Button>
          <Button onClick={() => clearQueryCache()} variant="outline" size="sm">
            <Trash2 className="h-4 w-4 mr-2" />
            Limpar Cache
          </Button>
          <Button onClick={updateQueryCache} variant="outline" size="sm">
            Atualizar Lista
          </Button>
        </div>

        <div className="space-y-2">
          <h3 className="font-semibold">Status das Queries:</h3>
          {queryCache.length === 0 ? (
            <p className="text-gray-500">Nenhuma query no cache</p>
          ) : (
            queryCache.map((query, index) => (
              <div key={index} className="flex items-center justify-between p-2 border rounded">
                <div className="flex-1">
                  <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                    {JSON.stringify(query.queryKey)}
                  </code>
                  {query.error && (
                    <p className="text-red-500 text-xs mt-1">Error: {query.error}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Badge variant={query.state === 'success' ? 'default' : 
                                 query.state === 'loading' ? 'secondary' : 
                                 query.state === 'pending' ? 'outline' : 'destructive'}>
                    {query.state}
                  </Badge>
                  <Badge variant={query.isStale ? 'outline' : 'default'}>
                    {query.isStale ? 'Stale' : 'Fresh'}
                  </Badge>
                  <Badge variant="secondary">
                    {query.observers} obs
                  </Badge>
                  <Badge variant="outline">
                    {query.data}
                  </Badge>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => debugSpecificQuery(query.queryKey)}
                  >
                    <Bug className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default DebugPanel;
