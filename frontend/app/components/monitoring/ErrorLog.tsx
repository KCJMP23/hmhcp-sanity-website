'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  AlertTriangle, 
  Search,
  Filter,
  Download,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  Copy,
  ExternalLink
} from 'lucide-react';
import { format } from 'date-fns';
import { logger } from '@/lib/logger';

interface ErrorEntry {
  id: string;
  error_type: string;
  error_message: string;
  stack_trace?: string;
  url: string;
  user_agent?: string;
  ip_address?: string;
  session_id?: string;
  created_at: string;
  resolved: boolean;
  occurrences: number;
}

export function ErrorLog() {
  const [errors, setErrors] = useState<ErrorEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [errorType, setErrorType] = useState<string>('all');
  const [expandedErrors, setExpandedErrors] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchErrors();
  }, [errorType]);

  const fetchErrors = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (errorType !== 'all') params.append('type', errorType);
      
      const response = await fetch(`/api/monitoring/errors?${params}`);
      if (response.ok) {
        const data = await response.json();
        setErrors(data.errors || []);
      }
    } catch (error) {
      logger.error('Failed to fetch errors:', { error: error instanceof Error ? error : new Error(String(error)), action: 'error_logged', metadata: { error } });
    } finally {
      setLoading(false);
    }
  };

  const toggleErrorExpansion = (errorId: string) => {
    const newExpanded = new Set(expandedErrors);
    if (newExpanded.has(errorId)) {
      newExpanded.delete(errorId);
    } else {
      newExpanded.add(errorId);
    }
    setExpandedErrors(newExpanded);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const exportErrors = () => {
    const csvContent = [
      ['Timestamp', 'Type', 'Message', 'URL', 'Occurrences'],
      ...errors.map(error => [
        error.created_at,
        error.error_type,
        error.error_message,
        error.url,
        error.occurrences.toString()
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `error-log-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
  };

  const filteredErrors = errors.filter(error =>
    error.error_message.toLowerCase().includes(searchTerm.toLowerCase()) ||
    error.error_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    error.url.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getErrorTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'syntaxerror':
      case 'referenceerror':
        return 'destructive';
      case 'typeerror':
        return 'secondary';
      case 'network':
        return 'outline';
      default:
        return 'default';
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Error Log
          </CardTitle>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={fetchErrors}
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              Refresh
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={exportErrors}
            >
              <Download className="h-4 w-4 mr-1" />
              Export
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search errors..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            
            <Select value={errorType} onValueChange={setErrorType}>
              <SelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="SyntaxError">Syntax Errors</SelectItem>
                <SelectItem value="TypeError">Type Errors</SelectItem>
                <SelectItem value="ReferenceError">Reference Errors</SelectItem>
                <SelectItem value="Network">Network Errors</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Error List */}
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-pulse text-muted-foreground">Loading errors...</div>
            </div>
          ) : filteredErrors.length === 0 ? (
            <div className="flex items-center justify-center h-64">
              <p className="text-muted-foreground">No errors found</p>
            </div>
          ) : (
            <ScrollArea className="h-96">
              <div className="space-y-2">
                {filteredErrors.map((error) => (
                  <div
                    key={error.id}
                    className="border p-4 space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-2 flex-1">
                        <button
                          onClick={() => toggleErrorExpansion(error.id)}
                          className="mt-0.5"
                        >
                          {expandedErrors.has(error.id) ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </button>
                        
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2">
                            <Badge variant={getErrorTypeColor(error.error_type)}>
                              {error.error_type}
                            </Badge>
                            {error.occurrences > 1 && (
                              <Badge variant="outline">
                                {error.occurrences} occurrences
                              </Badge>
                            )}
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(error.created_at), 'PPpp')}
                            </span>
                          </div>
                          
                          <p className="text-sm font-medium">{error.error_message}</p>
                          
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <ExternalLink className="h-3 w-3" />
                              {error.url}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      {!error.resolved && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            // Mark as resolved
                          }}
                        >
                          Resolve
                        </Button>
                      )}
                    </div>
                    
                    {expandedErrors.has(error.id) && (
                      <div className="ml-6 space-y-3">
                        {error.stack_trace && (
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-medium">Stack Trace</span>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => copyToClipboard(error.stack_trace!)}
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            </div>
                            <pre className="text-xs bg-muted p-3 overflow-x-hidden">
                              {error.stack_trace}
                            </pre>
                          </div>
                        )}
                        
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          {error.user_agent && (
                            <div>
                              <span className="text-muted-foreground">User Agent:</span>
                              <p className="font-mono truncate">{error.user_agent}</p>
                            </div>
                          )}
                          {error.session_id && (
                            <div>
                              <span className="text-muted-foreground">Session ID:</span>
                              <p className="font-mono">{error.session_id}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>
      </CardContent>
    </Card>
  );
}