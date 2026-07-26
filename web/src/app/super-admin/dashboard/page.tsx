"use client"

import { motion } from "framer-motion"
import { Building2, Activity, Users, Server, ArrowUpRight, Plus, Globe } from "lucide-react"
import { Button } from "@/components/ui/button"

const stats = [
  {
    title: "Total Organizations",
    value: "142",
    change: "+12.5%",
    trend: "up",
    icon: <Building2 size={20} />,
  },
  {
    title: "Active Users",
    value: "8,234",
    change: "+18.2%",
    trend: "up",
    icon: <Users size={20} />,
  },
  {
    title: "System Health",
    value: "99.9%",
    change: "Optimal",
    trend: "neutral",
    icon: <Activity size={20} />,
  },
  {
    title: "Global Servers",
    value: "24",
    change: "Online",
    trend: "neutral",
    icon: <Server size={20} />,
  },
]

const recentOrgs = [
  { id: 1, name: "TechCorp Inc.", owner: "sarah@techcorp.com", status: "Active", plan: "Enterprise", date: "Today" },
  { id: 2, name: "Nexus Dynamics", owner: "alex@nexus.io", status: "Active", plan: "Pro", date: "Yesterday" },
  { id: 3, name: "Starlight Media", owner: "chris@starlight.co", status: "Provisioning", plan: "Starter", date: "2 days ago" },
  { id: 4, name: "Omni Systems", owner: "admin@omni.net", status: "Suspended", plan: "Pro", date: "4 days ago" },
]

export default function SuperAdminDashboard() {
  return (
    <div className="p-8 max-w-7xl mx-auto space-y-10">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-1"
        >
          <div className="flex items-center gap-3">
            <div className="h-8 w-1 bg-accent rounded-full" />
            <h1 className="text-display text-3xl md:text-4xl">System Overview</h1>
          </div>
          <p className="text-body text-muted-foreground pl-4">
            Manage your global infrastructure and organization tenants.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Button variant="primary" className="gap-2 shadow-elevated">
            <Plus size={16} />
            Provision Organization
          </Button>
        </motion.div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 * idx }}
            className="group relative overflow-hidden rounded-2xl bg-card border border-border p-6 shadow-soft hover:shadow-card transition-all"
          >
            <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
              {stat.icon}
            </div>
            
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-accent/10 text-accent">
                {stat.icon}
              </div>
              <h3 className="text-body-sm font-medium text-muted-foreground">{stat.title}</h3>
            </div>
            
            <div className="flex items-baseline gap-3">
              <span className="text-h1">{stat.value}</span>
              <span className={`text-caption font-semibold ${stat.trend === 'up' ? 'text-success' : 'text-muted-foreground'}`}>
                {stat.change}
              </span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Dashboard Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Panel: Recent Organizations */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="lg:col-span-2 rounded-2xl bg-card border border-border shadow-soft overflow-hidden"
        >
          <div className="p-6 border-b border-border flex justify-between items-center bg-card/50 backdrop-blur-sm">
            <h2 className="text-h3">Recent Organizations</h2>
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
              View All <ArrowUpRight size={16} className="ml-1" />
            </Button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border text-caption text-muted-foreground">
                  <th className="p-4 font-medium">Organization</th>
                  <th className="p-4 font-medium">Owner</th>
                  <th className="p-4 font-medium">Plan</th>
                  <th className="p-4 font-medium">Status</th>
                  <th className="p-4 font-medium">Created</th>
                </tr>
              </thead>
              <tbody className="text-body-sm">
                {recentOrgs.map((org) => (
                  <tr key={org.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="p-4 font-medium flex items-center gap-3">
                      <div className="h-8 w-8 rounded-md bg-accent/10 flex items-center justify-center text-accent text-caption font-bold">
                        {org.name.charAt(0)}
                      </div>
                      {org.name}
                    </td>
                    <td className="p-4 text-muted-foreground">{org.owner}</td>
                    <td className="p-4">
                      <span className="inline-flex items-center rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground border border-border">
                        {org.plan}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-xs font-medium ${
                        org.status === 'Active' ? 'bg-success/10 text-success border border-success/20' :
                        org.status === 'Provisioning' ? 'bg-warning/10 text-warning border border-warning/20' :
                        'bg-destructive/10 text-destructive border border-destructive/20'
                      }`}>
                        <div className={`h-1.5 w-1.5 rounded-full ${
                          org.status === 'Active' ? 'bg-success' :
                          org.status === 'Provisioning' ? 'bg-warning' :
                          'bg-destructive'
                        }`} />
                        {org.status}
                      </span>
                    </td>
                    <td className="p-4 text-muted-foreground">{org.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Side Panel: Global Activity */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="rounded-2xl bg-gradient-to-br from-accent-900 to-accent-800 text-white p-1 overflow-hidden shadow-elevated relative"
        >
          {/* Background Elements */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-white/5 rounded-full blur-2xl" />
          <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-white/5 rounded-full blur-2xl" />
          
          <div className="h-full w-full rounded-xl bg-accent-900/80 backdrop-blur-md border border-white/10 p-6 flex flex-col relative z-10">
            <div className="flex items-center gap-3 mb-8">
              <Globe className="text-accent-300" size={24} />
              <h2 className="text-h3 font-semibold text-white">Global Network</h2>
            </div>

            <div className="flex-1 space-y-6">
              {[
                { region: "US East (N. Virginia)", status: "Operational", load: "42%" },
                { region: "EU West (London)", status: "Operational", load: "68%" },
                { region: "Asia Pacific (Tokyo)", status: "Operational", load: "31%" },
              ].map((region, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex justify-between text-caption text-accent-100">
                    <span>{region.region}</span>
                    <span className="text-success">{region.status}</span>
                  </div>
                  <div className="h-2 w-full bg-black/40 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: region.load }}
                      transition={{ duration: 1, delay: 0.8 + (i * 0.2) }}
                      className="h-full bg-accent-400 rounded-full"
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 p-4 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
              <div>
                <p className="text-caption text-accent-200">Network Traffic</p>
                <p className="text-body font-medium text-white">4.2 TB / day</p>
              </div>
              <Activity className="text-accent-300" size={20} />
            </div>
          </div>
        </motion.div>

      </div>
    </div>
  )
}
