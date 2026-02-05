"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import WorkflowCanvas from "@/components/workflow/WorkflowCanvas";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

export default function WorkflowDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [workflow, setWorkflow] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchWorkflow = useCallback(async () => {
    try {
      setLoading(true);
      // Use dedicated endpoint for single workflow fetch (more efficient)
      const response = await fetch(`/api/scriptforge/workflows/save?id=${params.id}`);
      const data = await response.json();

      if (data.success && data.workflow) {
        // Detailed logging to verify DB data
        console.log('Loaded workflow from DB:', {
          id: data.workflow._id,
          name: data.workflow.name,
          status: data.workflow.status,
          nodeCount: data.workflow.nodes?.length,
          nodesWithResults: data.workflow.nodes?.filter(n => n.data?.result).length,
          nodesWithOutput: data.workflow.nodes?.filter(n => n.data?.output).length,
          nodeStatuses: data.workflow.nodes?.map(n => ({ id: n.id, type: n.data?.agentType, status: n.data?.status, hasResult: !!n.data?.result }))
        });
        setWorkflow(data.workflow);
      } else {
        // Fallback to list if not found
        console.log('Workflow not found via save endpoint, trying list...');
        const listResponse = await fetch(`/api/scriptforge/workflows/list`);
        const listData = await listResponse.json();

        if (listData.success) {
          const found = listData.workflows.find(w => w._id === params.id);
          if (found) {
            setWorkflow(found);
          } else {
            toast.error('Workflow not found');
            router.push('/workflows');
          }
        }
      }
    } catch (error) {
      console.error('Error fetching workflow:', error);
      toast.error('Failed to fetch workflow');
    } finally {
      setLoading(false);
    }
  }, [params.id, router]);

  // Fetch on mount and when params change
  useEffect(() => {
    if (params.id) {
      fetchWorkflow();
    }
  }, [params.id, fetchWorkflow]);

  const handleSave = async (nodes, edges) => {
    try {
      const response = await fetch('/api/scriptforge/workflows/save', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          workflowId: params.id,
          updates: {
            nodes,
            edges
          }
        })
      });

      if (response.ok) {
        toast.success('Workflow saved');
        fetchWorkflow();
      }
    } catch (error) {
      toast.error('Failed to save workflow');
    }
  };

  const handleExecute = async () => {
    try {
      const response = await fetch('/api/scriptforge/workflows/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          workflowId: params.id
        })
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Workflow executed successfully');
        // Update workflow with results from server
        if (data.workflow) {
          setWorkflow(data.workflow);
        } else {
          fetchWorkflow();
        }
      } else {
        toast.error(data.error || 'Failed to execute workflow');
        fetchWorkflow(); // Refresh to get current state
      }
    } catch (error) {
      toast.error('An error occurred');
      fetchWorkflow();
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-950">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (!workflow) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-950">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Workflow not found</h2>
          <Button onClick={() => router.push('/workflows')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Workflows
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen">
      <WorkflowCanvas
        workflow={workflow}
        onSave={handleSave}
        onExecute={handleExecute}
        onRefresh={fetchWorkflow}
      />
    </div>
  );
}
