import React from 'react';
import { X, CheckCircle, XCircle } from 'lucide-react';
import { motion } from 'motion/react';

interface ApprovalModalProps {
  request: any;
  action: 'approve' | 'deny';
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ApprovalModal({ request, action, onConfirm, onCancel }: ApprovalModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6"
      >
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className={`${action === 'approve' ? 'bg-green-500' : 'bg-red-500'} text-white rounded-full p-2`}>
              {action === 'approve' ? <CheckCircle size={24} /> : <XCircle size={24} />}
            </div>
            <h3 className="text-2xl font-bold text-gray-800">
              {action === 'approve' ? 'Approve Request' : 'Deny Request'}
            </h3>
          </div>
          <button 
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>
        
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Employee:</span>
              <span className="font-medium text-gray-800">{request.employee}</span>
            </div>
            {request.department && (
              <div className="flex justify-between">
                <span className="text-gray-600">Department:</span>
                <span className="font-medium text-gray-800">{request.department}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-600">Request Type:</span>
              <span className="font-medium text-gray-800">{request.type}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Details:</span>
              <span className="font-medium text-gray-800">{request.details}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Date:</span>
              <span className="font-medium text-gray-800">{request.date}</span>
            </div>
          </div>
        </div>
        
        <div className={`mb-6 p-4 rounded-lg ${
          action === 'approve' 
            ? 'bg-green-50 border border-green-200' 
            : 'bg-red-50 border border-red-200'
        }`}>
          <p className={`text-sm ${action === 'approve' ? 'text-green-800' : 'text-red-800'}`}>
            {action === 'approve' 
              ? 'Are you sure you want to approve this request? The employee will be notified immediately.' 
              : 'Are you sure you want to deny this request? Please ensure you have communicated with the employee.'}
          </p>
        </div>
        
        <div className="flex space-x-3">
          <button 
            onClick={onCancel}
            className="flex-1 px-4 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={onConfirm}
            className={`flex-1 px-4 py-3 text-white rounded-lg font-medium transition-colors ${
              action === 'approve' 
                ? 'bg-green-500 hover:bg-green-600' 
                : 'bg-red-500 hover:bg-red-600'
            }`}
          >
            Confirm {action === 'approve' ? 'Approval' : 'Denial'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
