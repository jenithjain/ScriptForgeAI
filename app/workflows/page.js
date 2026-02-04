"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Plus, Workflow, Clock, CheckCircle, XCircle, Play, 
  Edit, Trash2, FileText, Sparkles, Loader2
} from "lucide-react";
import toast from "react-hot-toast";

export default function WorkflowsPage() {
  const router = useRouter();
  const [workflows, setWorkflows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchWorkflows();
  }, [filter]);

  const fetchWorkflows = async () => {
    try {
      setLoading(true);
      const params = filter !== 'all' ? `?status=${filter}` : '';
      const response = await fetch(`/api/scriptforge/workflows/list${params}`);
      const data = await response.json();
      
      if (data.success) {
        setWorkflows(data.workflows);
      }
    } catch (error) {
      toast.error('Failed to fetch workflows');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteWorkflow = async (id) => {
    if (!confirm('Are you sure you want to delete this workflow?')) return;

    try {
      const response = await fetch(`/api/scriptforge/workflows/save?id=${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        toast.success('Workflow deleted');
        fetchWorkflows();
      }
    } catch (error) {
      toast.error('Failed to delete workflow');
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      draft: { color: 'bg-gray-500', icon: FileText },
      active: { color: 'bg-blue-500', icon: Workflow },
      running: { color: 'bg-amber-500 animate-pulse', icon: Loader2 },
      completed: { color: 'bg-emerald-500', icon: CheckCircle },
      error: { color: 'bg-red-500', icon: XCircle }
    };

    const variant = variants[status] || variants.draft;
    const Icon = variant.icon;

    return (
      <Badge className={`${variant.color} text-white`}>
        <Icon className="w-3 h-3 mr-1" />
        {status}
      </Badge>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pt-20">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2">
              Script <span className="bg-linear-to-r from-emerald-500 via-teal-400 to-cyan-400 bg-clip-text text-transparent">Workflows</span>
            </h1>
            <p className="text-slate-700 dark:text-slate-300">
              Create and manage your end-to-end scriptwriting workflows
            </p>
          </div>
          <Button
            onClick={() => router.push('/workflows/create')}
            className="bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 hover:bg-emerald-600 transition-all"
            size="lg"
          >
            <Plus className="w-5 h-5 mr-2" />
            Create Workflow
          </Button>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {['all', 'draft', 'active', 'running', 'completed', 'error'].map((status) => (
            <Button
              key={status}
              onClick={() => setFilter(status)}
              variant={filter === status ? "default" : "outline"}
              className={filter === status ? "bg-emerald-600 text-white" : ""}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Button>
          ))}
        </div>

        {/* Workflows Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
          </div>
        ) : workflows.length === 0 ? (
          <Card className="border-2 border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-20">
              <Workflow className="w-16 h-16 text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold mb-2">No workflows found</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Get started by creating your first workflow
              </p>
              <Button
                onClick={() => router.push('/workflows/create')}
                className="bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 hover:bg-emerald-600 transition-all"
              >
                <Plus className="w-5 h-5 mr-2" />
                Create Workflow
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {workflows.map((workflow) => (
              <Card 
                key={workflow._id}
                className="group hover:shadow-xl transition-all duration-300 hover:scale-105 border border-slate-200/60 hover:border-emerald-500/50 cursor-pointer bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm"
                onClick={() => router.push(`/workflows/${workflow._id}`)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-2 mb-2">
                        <Sparkles className="w-5 h-5 text-emerald-600" />
                        {workflow.name}
                      </CardTitle>
                      <CardDescription className="line-clamp-2">
                        {workflow.description || workflow.brief}
                      </CardDescription>
                    </div>
                    {getStatusBadge(workflow.status)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {/* Progress */}
                    {workflow.progress && (
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-600 dark:text-gray-400">Progress</span>
                          <span className="font-semibold">
                            {workflow.progress.completedNodes.length}/{workflow.progress.totalNodes}
                          </span>
                        </div>
                        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                          <div
                            className="bg-linear-to-r from-emerald-500 via-teal-400 to-cyan-400 h-2 rounded-full transition-all"
                            style={{
                              width: `${(workflow.progress.completedNodes.length / workflow.progress.totalNodes) * 100}%`
                            }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Metadata */}
                    <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                      <div className="flex items-center gap-1">
                        <Workflow className="w-4 h-4" />
                        {workflow.nodes.length} agents
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {new Date(workflow.updatedAt).toLocaleDateString()}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-2 border-t">
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/workflows/${workflow._id}`);
                        }}
                        variant="outline"
                        size="sm"
                        className="flex-1"
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          // TODO: Execute workflow
                          toast.success('Workflow execution started');
                        }}
                        variant="outline"
                        size="sm"
                        className="flex-1 text-emerald-600 border-emerald-600 hover:bg-emerald-50"
                      >
                        <Play className="w-4 h-4 mr-1" />
                        Run
                      </Button>
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteWorkflow(workflow._id);
                        }}
                        variant="outline"
                        size="sm"
                        className="text-red-600 border-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
