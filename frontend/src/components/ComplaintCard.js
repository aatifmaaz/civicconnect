/**
 * Complaint Card Component
 */

import { formatDate, getStatusColor, getPriorityColor } from '../utils/helpers';

export default function ComplaintCard({ complaint, onClick }) {
  return (
    <div
      onClick={onClick}
      className="card cursor-pointer hover:shadow-lg transition-shadow transform hover:scale-105 duration-200"
    >
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{complaint.title}</h3>
        <span className={`badge badge-${getStatusColor(complaint.status)}`}>
          {complaint.status.replace('_', ' ').toUpperCase()}
        </span>
      </div>

      <p className="text-gray-600 text-sm mb-4 line-clamp-2">{complaint.description}</p>

      <div className="flex justify-between items-center mb-3">
        <span className={`badge badge-${getPriorityColor(complaint.priority)}`}>
          {complaint.priority.toUpperCase()}
        </span>
        <span className="text-xs text-gray-500">{formatDate(complaint.created_at)}</span>
      </div>

      <div className="text-sm text-gray-600">
        <p>Category: <span className="font-semibold">{complaint.category}</span></p>
      </div>

      {complaint.image_url && (
        <div className="mt-4">
          <img 
            src={complaint.image_url} 
            alt="Complaint" 
            className="w-full h-32 object-cover rounded"
          />
        </div>
      )}
    </div>
  );
}
