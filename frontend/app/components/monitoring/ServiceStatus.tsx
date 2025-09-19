'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Server, 
  Database, 
  Globe, 
  Mail, 
  Shield,
  Activity,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';

interface Service {
  name: string;
  status: 'healthy' | 'degraded' | 'down';
  responseTime?: number;
  uptime?: number;
  lastChecked?: string;
}

interface ServiceStatusProps {
  services: Service[];
}

const serviceIcons: Record<string, any> = {
  'Web Server': Globe,
  'Database': Database,
  'API': Server,
  'Email': Mail,
  'CDN': Shield,
  'Cache': Activity,
};

export function ServiceStatus({ services }: ServiceStatusProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-4 w-4 text-blue-600" />;
      case 'degraded':
        return <AlertCircle className="h-4 w-4 text-blue-600" />;
      case 'down':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'text-blue-600 bg-blue-50 dark:bg-blue-900/20';
      case 'degraded':
        return 'text-blue-600 bg-blue-50 dark:bg-blue-900/20';
      case 'down':
        return 'text-red-600 bg-red-50 dark:bg-blue-900/20';
      default:
        return '';
    }
  };

  const getResponseTimeColor = (responseTime?: number) => {
    if (!responseTime) return '';
    if (responseTime < 100) return 'text-blue-600';
    if (responseTime < 300) return 'text-blue-600';
    return 'text-red-600';
  };

  const defaultServices: Service[] = [
    { name: 'Web Server', status: 'healthy', responseTime: 45, uptime: 99.99 },
    { name: 'Database', status: 'healthy', responseTime: 12, uptime: 99.95 },
    { name: 'API', status: 'healthy', responseTime: 89, uptime: 99.98 },
    { name: 'Email', status: 'healthy', responseTime: 156, uptime: 100 },
    { name: 'CDN', status: 'healthy', responseTime: 23, uptime: 100 },
    { name: 'Cache', status: 'healthy', responseTime: 5, uptime: 99.99 },
  ];

  const displayServices = services.length > 0 ? services : defaultServices;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Server className="h-5 w-5" />
          Service Health
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayServices.map((service) => {
            const Icon = serviceIcons[service.name] || Server;
            
            return (
              <div
                key={service.name}
                className="p-4 border space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className="h-5 w-5 text-muted-foreground" />
                    <span className="font-medium">{service.name}</span>
                  </div>
                  <div className={`flex items-center gap-1 px-2 py-1  ${getStatusColor(service.status)}`}>
                    {getStatusIcon(service.status)}
                    <span className="text-xs font-medium capitalize">
                      {service.status}
                    </span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  {service.responseTime !== undefined && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Response Time</span>
                      <span className={`font-medium ${getResponseTimeColor(service.responseTime)}`}>
                        {service.responseTime}ms
                      </span>
                    </div>
                  )}
                  
                  {service.uptime !== undefined && (
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Uptime</span>
                        <span className="font-medium">{service.uptime}%</span>
                      </div>
                      <Progress 
                        value={service.uptime} 
                        className="h-2"
                      />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}