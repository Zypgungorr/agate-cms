'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

// Drag & Drop Types
const ItemType = 'CONCEPT_NOTE';

// Types
interface ConceptNote {
  id: string;
  campaignId: string;
  campaignName: string;
  authorId: string;
  authorName: string;
  title: string;
  content: string;
  status: string;
  tags: string[] | null;
  priority: number;
  isShared: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Campaign {
  id: string;
  title: string;
}

export default function ConceptNotesPage() {
  const [conceptNotes, setConceptNotes] = useState<ConceptNote[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const statuses = [
    { key: 'Ideas', label: 'Ideas', color: 'bg-blue-50 border-blue-200', textColor: 'text-blue-800' },
    { key: 'InReview', label: 'In Review', color: 'bg-yellow-50 border-yellow-200', textColor: 'text-yellow-800' },
    { key: 'Approved', label: 'Approved', color: 'bg-green-50 border-green-200', textColor: 'text-green-800' },
    { key: 'Archived', label: 'Archived', color: 'bg-gray-50 border-gray-200', textColor: 'text-gray-700' }
  ];

  const priorityColors = {
    1: 'text-green-600', // Low
    2: 'text-yellow-600', // Medium
    3: 'text-red-600' // High
  };

  const priorityLabels = {
    1: 'Low',
    2: 'Medium', 
    3: 'High'
  };

  useEffect(() => {
    loadData();
  }, [selectedCampaign]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load campaigns
      const campaignsResponse = await fetch('http://localhost:5135/api/campaigns', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (campaignsResponse.ok) {
        const campaignsData = await campaignsResponse.json();
        setCampaigns(campaignsData);
      }

      // Load concept notes
      const notesUrl = selectedCampaign === 'all' 
        ? 'http://localhost:5135/api/conceptnotes' 
        : `http://localhost:5135/api/conceptnotes?campaignId=${selectedCampaign}`;
        
      const notesResponse = await fetch(notesUrl, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (notesResponse.ok) {
        const notesData = await notesResponse.json();
        setConceptNotes(notesData);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getNotesForStatus = (status: string) => {
    return conceptNotes.filter(note => note.status === status);
  };

  const handleStatusChange = async (noteId: string, newStatus: string) => {
    try {
      const response = await fetch(`http://localhost:5135/api/conceptnotes/${noteId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        // Update local state
        setConceptNotes(prev => 
          prev.map(note => 
            note.id === noteId 
              ? { ...note, status: newStatus, updatedAt: new Date().toISOString() }
              : note
          )
        );
      } else {
        alert('Failed to update status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Error updating status');
    }
  };

  const handleDrop = async (noteId: string, newStatus: string) => {
    await handleStatusChange(noteId, newStatus);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="min-h-screen bg-gray-50">
        <div className="p-6 space-y-7 max-w-7xl mx-auto">
          {/* Header */}
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-semibold text-gray-900">Concept Notes Board</h1>
                <p className="text-gray-600 mt-1">Manage creative ideas from concept to approval</p>
              </div>
              <div className="hidden md:flex items-center space-x-2 bg-gradient-to-r from-purple-100 to-blue-100 text-purple-700 px-3 py-2 rounded-lg text-sm">
                <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                <span>Creative Workflow Active</span>
              </div>
            </div>
          </div>

          {/* Filters and Actions */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Campaign</label>
                  <select
                    value={selectedCampaign}
                    onChange={(e) => setSelectedCampaign(e.target.value)}
                    className="border border-gray-300 text-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Campaigns</option>
                    {campaigns.map(campaign => (
                      <option key={campaign.id} value={campaign.id}>
                        {campaign.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
              >
                + New Concept Note
              </button>
            </div>
          </div>

          {/* Kanban Board */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {statuses.map(status => (
              <DropZone
                key={status.key}
                status={status.key}
                onDrop={handleDrop}
                className={`${status.color} rounded-lg border-2 p-6 min-h-[600px] shadow-sm`}
              >
                {/* Column Header */}
                <div className="mb-6 pb-3 border-b border-gray-200">
                  <h3 className={`text-lg font-medium ${status.textColor} mb-2`}>
                    {status.label}
                  </h3>
                  <div className={`text-sm ${status.textColor} opacity-75`}>
                    {getNotesForStatus(status.key).length} notes
                  </div>
                </div>

            {/* Notes */}
            <div className="space-y-4">
              {getNotesForStatus(status.key).map(note => (
                <ConceptNoteCard
                  key={note.id}
                  note={note}
                  priorityColors={priorityColors}
                  priorityLabels={priorityLabels}
                  statuses={statuses}
                  onStatusChange={handleStatusChange}
                />
              ))}

              {/* Empty State */}
              {getNotesForStatus(status.key).length === 0 && (
                <div className="text-center text-gray-500 py-8">
                  <div className="text-4xl mb-2">💡</div>
                  <p className="text-sm">No notes in {status.label.toLowerCase()}</p>
                </div>
              )}
            </div>
          </DropZone>
        ))}
      </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {statuses.map(status => (
              <div key={status.key} className={`${status.color} rounded-lg p-4 shadow-sm border-2 hover:shadow-md transition-shadow`}>
                <div className={`text-2xl font-bold ${status.textColor}`}>
                  {getNotesForStatus(status.key).length}
                </div>
                <div className={`text-sm ${status.textColor} opacity-75`}>{status.label}</div>
              </div>
            ))}
          </div>

      {/* Create Modal */}
      {showCreateModal && (
        <CreateConceptNoteModal
          campaigns={campaigns}
          onClose={() => setShowCreateModal(false)}
          onSuccess={loadData}
        />
      )}
        </div>
      </div>
    </DndProvider>
  );
}

// Drag & Drop Components
interface ConceptNoteCardProps {
  note: ConceptNote;
  priorityColors: any;
  priorityLabels: any;
  statuses: any[];
  onStatusChange: (noteId: string, newStatus: string) => void;
}

function ConceptNoteCard({ note, priorityColors, priorityLabels, statuses, onStatusChange }: ConceptNoteCardProps) {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: ItemType,
    item: { id: note.id, currentStatus: note.status },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }));

  return (
    <div
      ref={drag as any}
      className={`bg-white rounded-lg p-4 shadow-md hover:shadow-lg transition-shadow cursor-move border border-gray-200 ${
        isDragging ? 'opacity-50 rotate-3 scale-105' : ''
      }`}
    >
      {/* Note Header */}
      <div className="flex justify-between items-start mb-3">
        <h4 className="font-semibold text-gray-900 text-sm leading-tight">
          {note.title}
        </h4>
        <span className={`text-xs font-medium ${priorityColors[note.priority as keyof typeof priorityColors]}`}>
          {priorityLabels[note.priority as keyof typeof priorityLabels]}
        </span>
      </div>

      {/* Note Content */}
      <p className="text-gray-600 text-sm mb-3 line-clamp-3">
        {note.content}
      </p>

      {/* Tags */}
      {note.tags && note.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {note.tags.slice(0, 3).map((tag, index) => (
            <span
              key={index}
              className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full"
            >
              {tag}
            </span>
          ))}
          {note.tags.length > 3 && (
            <span className="text-gray-500 text-xs">+{note.tags.length - 3} more</span>
          )}
        </div>
      )}

      {/* Note Footer */}
      <div className="flex justify-between items-center text-xs text-gray-500 border-t pt-3">
        <div>
          <div className="font-medium">{note.campaignName}</div>
          <div>by {note.authorName}</div>
        </div>
        <div>
          {new Date(note.createdAt).toLocaleDateString()}
        </div>
      </div>

      {/* Status Change Buttons */}
      <div className="flex gap-2 mt-3">
        {statuses
          .filter(s => s.key !== note.status)
          .slice(0, 2)
          .map(targetStatus => (
            <button
              key={targetStatus.key}
              onClick={() => onStatusChange(note.id, targetStatus.key)}
              className={`text-xs px-3 py-1 rounded-full border ${targetStatus.color} ${targetStatus.textColor} hover:opacity-80 transition-all`}
            >
              → {targetStatus.label}
            </button>
          ))
        }
      </div>
    </div>
  );
}

interface DropZoneProps {
  status: string;
  onDrop: (noteId: string, newStatus: string) => void;
  className?: string;
  children: React.ReactNode;
}

function DropZone({ status, onDrop, className, children }: DropZoneProps) {
  const [{ isOver, canDrop }, drop] = useDrop(() => ({
    accept: ItemType,
    drop: (item: { id: string; currentStatus: string }) => {
      if (item.currentStatus !== status) {
        onDrop(item.id, status);
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  }));

  const dropzoneClass = `${className} ${
    isOver && canDrop ? 'ring-4 ring-purple-300 ring-opacity-50 scale-102 shadow-lg' : ''
  } ${canDrop ? 'ring-2 ring-purple-200' : ''} transition-all duration-300`;

  return (
    <div ref={drop as any} className={dropzoneClass}>
      {children}
    </div>
  );
}

// Create Modal Component
function CreateConceptNoteModal({ campaigns, onClose, onSuccess }: {
  campaigns: Campaign[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    campaignId: '',
    title: '',
    content: '',
    status: 'Ideas',
    tags: '',
    priority: 1,
    isShared: true
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const tagsArray = formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
      
      const response = await fetch('http://localhost:5135/api/conceptnotes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          ...formData,
          tags: tagsArray.length > 0 ? tagsArray : null
        })
      });

      if (response.ok) {
        onSuccess();
        onClose();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to create concept note');
      }
    } catch (error) {
      console.error('Error creating concept note:', error);
      alert('Error creating concept note');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Create New Concept Note</h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Campaign *</label>
              <select
                required
                value={formData.campaignId}
                onChange={(e) => setFormData({...formData, campaignId: e.target.value})}
                className="w-full border border-gray-300 text-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a campaign</option>
                {campaigns.map(campaign => (
                  <option key={campaign.id} value={campaign.id}>
                    {campaign.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({...formData, status: e.target.value})}
                className="w-full border border-gray-300 rounded-lg text-gray-700 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Ideas">Ideas</option>
                <option value="InReview">In Review</option>
                <option value="Approved">Approved</option>
                <option value="Archived">Archived</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Title *</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder:text-gray-600"
              placeholder="Enter concept title"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Content *</label>
            <textarea
              required
              rows={4}
              value={formData.content}
              onChange={(e) => setFormData({...formData, content: e.target.value})}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder:text-gray-600"
              placeholder="Describe your concept idea..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
              <input
                type="text"
                value={formData.tags}
                onChange={(e) => setFormData({...formData, tags: e.target.value})}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder:text-gray-600"
                placeholder="TV, Digital, Print (comma separated)"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({...formData, priority: parseInt(e.target.value)})}
                className="w-full border border-gray-300 text-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={1}>Low</option>
                <option value={2}>Medium</option>
                <option value={3}>High</option>
              </select>
            </div>
          </div>

          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.isShared}
                onChange={(e) => setFormData({...formData, isShared: e.target.checked})}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">Share with team members</span>
            </label>
          </div>

          <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Concept Note'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
