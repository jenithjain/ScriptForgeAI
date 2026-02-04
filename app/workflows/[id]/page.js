"use client";

import { useState, useEffect } from "react";
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

  useEffect(() => {
    if (params.id) {
      fetchWorkflow();
    }
  }, [params.id]);

  const fetchWorkflow = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/scriptforge/workflows/list`);
      const data = await response.json();
      
      if (data.success) {
        const found = data.workflows.find(w => w._id === params.id);
        if (found) {
          setWorkflow(found);
        } else {
          toast.error('Workflow not found');
          router.push('/workflows');
        }
      }
    } catch (error) {
      toast.error('Failed to fetch workflow');
    } finally {
      setLoading(false);
    }
  };

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
        fetchWorkflow();
      } else {
        toast.error(data.error || 'Failed to execute workflow');
      }
    } catch (error) {
      toast.error('An error occurred');
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
      />
    </div>
  );
}
