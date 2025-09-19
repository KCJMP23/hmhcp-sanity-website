'use client';

import React, { useState, useEffect } from 'react';
import { useCoreIntegration } from '@/hooks/use-core-integration';
import { motion } from 'framer-motion';
import { 
  Users, 
  UserPlus, 
  Shield, 
  CheckCircle, 
  AlertTriangle, 
  Search, 
  Filter, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Mail, 
  Lock,
  Unlock,
  Eye,
  EyeOff,
  TrendingUp,
  BarChart3,
  Clock,
  Activity
} from 'lucide-react';
import { FrostedCard } from '@/components/ui/frosted-card';
import { Typography } from '@/components/ui/apple-typography';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AppleButton } from '@/components/ui/apple-button';

export default function UsersDashboard() {
  const { userManagement, analytics, systemMonitoring } = useCoreIntegration();
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

  // Mock data for demonstration
  const [users] = useState([
    {
      id: '1',
      email: 'admin@hm-hcp.com',
      role: 'super_admin',
      status: 'active',
      name: 'System Administrator',
      department: 'IT',
      lastLogin: '2025-08-04',
      permissions: ['all'],
      avatar: 'SA',
      activity: 'high',
      securityLevel: 'maximum'
    },
    {
      id: '2', 
      email: 'editor@hm-hcp.com',
      role: 'editor',
      status: 'active',
      name: 'Content Editor',
      department: 'Marketing',
      lastLogin: '2025-08-03',
      permissions: ['posts', 'media', 'users:read'],
      avatar: 'CE',
      activity: 'medium',
      securityLevel: 'standard'
    },
    {
      id: '3',
      email: 'viewer@hm-hcp.com', 
      role: 'viewer',
      status: 'inactive',
      name: 'John Viewer',
      department: 'Research',
      lastLogin: '2025-07-28',
      permissions: ['posts:read'],
      avatar: 'JV',
      activity: 'low',
      securityLevel: 'basic'
    },
    {
      id: '4',
      email: 'dr.smith@hm-hcp.com',
      role: 'editor',
      status: 'active', 
      name: 'Dr. Sarah Smith',
      department: 'Clinical Research',
      lastLogin: '2025-08-04',
      permissions: ['posts', 'research:write'],
      avatar: 'DS',
      activity: 'high',
      securityLevel: 'enhanced'
    },
    {
      id: '5',
      email: 'analytics@hm-hcp.com',
      role: 'analyst',
      status: 'active',
      name: 'Analytics Team',
      department: 'Data Science',
      lastLogin: '2025-08-04',
      permissions: ['analytics:full', 'reports:write'],
      avatar: 'AT',
      activity: 'medium',
      securityLevel: 'enhanced'
    },
    {
      id: '6',
      email: 'moderator@hm-hcp.com',
      role: 'moderator',
      status: 'active',
      name: 'Content Moderator',
      department: 'Content',
      lastLogin: '2025-08-04',
      permissions: ['posts:moderate', 'comments:moderate'],
      avatar: 'CM',
      activity: 'high',
      securityLevel: 'standard'
    }
  ]);

  const [userStats] = useState({
    totalUsers: 6,
    activeUsers: 5,
    inactiveUsers: 1,
    adminUsers: 1,
    editorUsers: 2,
    analystUsers: 1,
    viewerUsers: 1,
    moderatorUsers: 1,
    thisMonth: 2,
    lastMonth: 1
  });

  const [recentActivity] = useState([
    { id: 1, user: 'System Administrator', action: 'User role updated', target: 'Content Editor', time: '2 minutes ago', type: 'role_change' },
    { id: 2, user: 'Dr. Sarah Smith', action: 'Content published', target: 'Research Article', time: '5 minutes ago', type: 'content' },
    { id: 3, user: 'Analytics Team', action: 'Report generated', target: 'Monthly Analytics', time: '8 minutes ago', type: 'report' },
    { id: 4, user: 'Content Moderator', action: 'Comment approved', target: 'Blog Post', time: '12 minutes ago', type: 'moderation' }
  ]);

  useEffect(() => {
    // Track page view
    analytics.trackPageView('/admin/users');
    analytics.trackEvent('users_dashboard_viewed', { section: 'user_management' });
  }, [analytics]);

  // Filter users based on search and filters
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.department.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesRole = roleFilter === 'all' || user.role === roleFilter
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter
    
    return matchesSearch && matchesRole && matchesStatus
  });

  const handleBulkAction = (action: string) => {
    console.log(`Bulk action: ${action} on users:`, selectedUsers);
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'super_admin':
        return 'bg-red-100 text-red-800';
      case 'admin':
        return 'bg-purple-100 text-purple-800';
      case 'editor':
        return 'bg-blue-100 text-blue-800';
      case 'analyst':
        return 'bg-green-100 text-green-800';
      case 'moderator':
        return 'bg-orange-100 text-orange-800';
      case 'viewer':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    return status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800';
  };

  const getActivityIcon = (activity: string) => {
    switch (activity) {
      case 'high':
        return <Activity className="h-4 w-4 text-green-600" />;
      case 'medium':
        return <Clock className="h-4 w-4 text-blue-600" />;
      case 'low':
        return <EyeOff className="h-4 w-4 text-gray-600" />;
      default:
        return <Eye className="h-4 w-4 text-gray-600" />;
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="flex justify-between items-center"
      >
        <div>
          <Typography variant="display" className="text-gray-900">User Management</Typography>
          <Typography variant="body" className="text-gray-600">
            Manage system users, roles, permissions, and security settings
          </Typography>
        </div>
        <div className="flex space-x-3">
          <AppleButton variant="outline">
            <Filter className="h-4 w-4 mr-2" />
            Advanced Filters
          </AppleButton>
          <AppleButton>
            <UserPlus className="h-4 w-4 mr-2" />
            Add User
          </AppleButton>
        </div>
      </motion.div>

      {/* Key Metrics */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        <FrostedCard className="hover:shadow-xl transition-all duration-300">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <Users className="h-8 w-8 text-blue-600" />
              <TrendingUp className="h-5 w-5 text-green-500" />
            </div>
            <Typography variant="display" className="text-3xl font-light text-gray-900 mb-2">
              {userStats.totalUsers}
            </Typography>
            <Typography variant="label" className="text-gray-700 mb-2">Total Users</Typography>
            <Progress value={75} className="h-2" />
            <Typography variant="small" className="text-blue-600 mt-2">
              +{userStats.thisMonth} this month
            </Typography>
          </div>
        </FrostedCard>

        <FrostedCard className="hover:shadow-xl transition-all duration-300">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <TrendingUp className="h-5 w-5 text-green-500" />
            </div>
            <Typography variant="display" className="text-3xl font-light text-gray-900 mb-2">
              {userStats.activeUsers}
            </Typography>
            <Typography variant="label" className="text-gray-700 mb-2">Active Users</Typography>
            <Progress value={(userStats.activeUsers / userStats.totalUsers) * 100} className="h-2" />
            <Typography variant="small" className="text-green-600 mt-2">
              {((userStats.activeUsers / userStats.totalUsers) * 100).toFixed(0)}% active rate
            </Typography>
          </div>
        </FrostedCard>

        <FrostedCard className="hover:shadow-xl transition-all duration-300">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <Shield className="h-8 w-8 text-purple-600" />
              <TrendingUp className="h-5 w-5 text-green-500" />
            </div>
            <Typography variant="display" className="text-3xl font-light text-gray-900 mb-2">
              {userStats.adminUsers + userStats.editorUsers}
            </Typography>
            <Typography variant="label" className="text-gray-700 mb-2">Admin Users</Typography>
            <Progress value={60} className="h-2" />
            <Typography variant="small" className="text-purple-600 mt-2">
              Elevated permissions
            </Typography>
          </div>
        </FrostedCard>

        <FrostedCard className="hover:shadow-xl transition-all duration-300">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <BarChart3 className="h-8 w-8 text-orange-600" />
              <TrendingUp className="h-5 w-5 text-green-500" />
            </div>
            <Typography variant="display" className="text-3xl font-light text-gray-900 mb-2">
              {userStats.analystUsers}
            </Typography>
            <Typography variant="label" className="text-gray-700 mb-2">Analytics Users</Typography>
            <Progress value={40} className="h-2" />
            <Typography variant="small" className="text-orange-600 mt-2">
              Data access enabled
            </Typography>
          </div>
        </FrostedCard>
      </motion.div>

      {/* Search and Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <FrostedCard>
          <div className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search users by name, email, or department..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Roles</option>
                  <option value="super_admin">Super Admin</option>
                  <option value="admin">Admin</option>
                  <option value="editor">Editor</option>
                  <option value="analyst">Analyst</option>
                  <option value="moderator">Moderator</option>
                  <option value="viewer">Viewer</option>
                </select>
                
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
            
            {/* Bulk Actions */}
            {selectedUsers.length > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className="mt-4 flex items-center gap-2 p-3 bg-blue-50 rounded-2xl"
              >
                <span className="text-sm font-medium">
                  {selectedUsers.length} user{selectedUsers.length > 1 ? 's' : ''} selected
                </span>
                <AppleButton size="sm" variant="outline" onClick={() => handleBulkAction('email')}>
                  <Mail className="h-4 w-4 mr-2" />
                  Send Email
                </AppleButton>
                <AppleButton size="sm" variant="outline" onClick={() => handleBulkAction('role')}>
                  Change Role
                </AppleButton>
                <AppleButton size="sm" variant="outline" onClick={() => handleBulkAction('status')}>
                  Toggle Status
                </AppleButton>
              </motion.div>
            )}
          </div>
        </FrostedCard>
      </motion.div>

      {/* Users Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
      >
        <Typography variant="heading2" className="mb-6 text-gray-900">
          Users ({filteredUsers.length} of {userStats.totalUsers})
        </Typography>
        <FrostedCard>
          <div className="p-6">
            <div className="space-y-4">
              {filteredUsers.map((user, index) => (
                <motion.div
                  key={user.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className="flex items-center justify-between p-4 border border-gray-200/50 rounded-2xl bg-white/50 backdrop-blur-sm hover:shadow-md transition-all duration-200"
                >
                  <div className="flex items-center space-x-4">
                    <input
                      type="checkbox"
                      checked={selectedUsers.includes(user.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedUsers([...selectedUsers, user.id]);
                        } else {
                          setSelectedUsers(selectedUsers.filter(id => id !== user.id));
                        }
                      }}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    
                    <div className="h-10 w-10 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-medium">
                      {user.avatar}
                    </div>
                    
                    <div>
                      <Typography variant="label" className="text-gray-900">
                        {user.name}
                      </Typography>
                      <Typography variant="small" className="text-gray-600">
                        {user.department} • {user.email}
                      </Typography>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <div className="flex items-center space-x-2 mb-1">
                        {getActivityIcon(user.activity)}
                        <Typography variant="small" className="text-gray-600">
                          {user.lastLogin}
                        </Typography>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className={getRoleColor(user.role)}>
                          {user.role.replace('_', ' ')}
                        </Badge>
                        <Badge className={getStatusColor(user.status)}>
                          {user.status}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      <AppleButton variant="outline" size="sm">
                        <Edit className="h-4 w-4" />
                      </AppleButton>
                      <AppleButton variant="outline" size="sm">
                        {user.status === 'active' ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
                      </AppleButton>
                      <AppleButton variant="outline" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </AppleButton>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </FrostedCard>
      </motion.div>

      {/* Recent Activity */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
      >
        <Typography variant="heading2" className="mb-6 text-gray-900">
          Recent User Activity
        </Typography>
        <FrostedCard>
          <div className="p-6">
            <div className="space-y-4">
              {recentActivity.map((activity, index) => (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className="flex items-center justify-between p-4 border border-gray-200/50 rounded-2xl bg-white/50 backdrop-blur-sm"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <Activity className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <Typography variant="label" className="text-gray-900">
                        {activity.user}
                      </Typography>
                      <Typography variant="small" className="text-gray-600">
                        {activity.action} • {activity.target}
                      </Typography>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <Typography variant="small" className="text-gray-600">
                      {activity.time}
                    </Typography>
                    <Badge variant="outline" className="mt-1">
                      {activity.type}
                    </Badge>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </FrostedCard>
      </motion.div>

      {/* Security Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.5 }}
      >
        <Typography variant="heading2" className="mb-6 text-gray-900">
          Security Overview
        </Typography>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <FrostedCard className="hover:shadow-xl transition-all duration-300">
            <div className="p-6 text-center">
              <Shield className="h-16 w-16 text-green-600 mx-auto mb-4" />
              <Typography variant="heading4" className="text-gray-900 mb-2">
                Access Control
              </Typography>
              <Typography variant="body" className="text-gray-600 mb-4">
                Role-based permissions and security policies
              </Typography>
              <AppleButton variant="outline" size="sm">
                <Shield className="h-4 w-4 mr-2" />
                Configure
              </AppleButton>
            </div>
          </FrostedCard>

          <FrostedCard className="hover:shadow-xl transition-all duration-300">
            <div className="p-6 text-center">
              <Activity className="h-16 w-16 text-blue-600 mx-auto mb-4" />
              <Typography variant="heading4" className="text-gray-900 mb-2">
                Activity Monitoring
              </Typography>
              <Typography variant="body" className="text-gray-600 mb-4">
                Track user actions and security events
              </Typography>
              <AppleButton variant="outline" size="sm">
                <Activity className="h-4 w-4 mr-2" />
                View Logs
              </AppleButton>
            </div>
          </FrostedCard>

          <FrostedCard className="hover:shadow-xl transition-all duration-300">
            <div className="p-6 text-center">
              <Lock className="h-16 w-16 text-purple-600 mx-auto mb-4" />
              <Typography variant="heading4" className="text-gray-900 mb-2">
                Authentication
              </Typography>
              <Typography variant="body" className="text-gray-600 mb-4">
                Multi-factor authentication and security settings
              </Typography>
              <AppleButton variant="outline" size="sm">
                <Lock className="h-4 w-4 mr-2" />
                Settings
              </AppleButton>
            </div>
          </FrostedCard>
        </div>
      </motion.div>
    </div>
  );
}
