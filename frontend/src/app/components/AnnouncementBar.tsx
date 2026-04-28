import React, { useEffect, useState } from 'react';
import { Megaphone, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { announcementsApi, Announcement } from '@/lib/api';

export default function AnnouncementBar() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [dismissed, setDismissed] = useState<Set<number>>(new Set());

  useEffect(() => {
    announcementsApi.list()
      .then(setAnnouncements)
      .catch(() => {});
  }, []);

  const visible = announcements.filter((a) => !dismissed.has(a.id));

  if (visible.length === 0) return null;

  return (
    <div className="space-y-3">
      <AnimatePresence>
        {visible.map((a) => (
          <motion.div
            key={a.id}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-red-100 border-l-4 border-red-500 rounded-lg shadow-md p-4"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3">
                <div className="bg-red-500 text-white rounded-full p-2 mt-0.5">
                  <Megaphone size={20} />
                </div>
                <div className="flex-1">
                  <h3 className="text-red-700 font-bold text-lg mb-1">Bulletin Board</h3>
                  <p className="text-gray-700">{a.content}</p>
                  <p className="text-xs text-gray-500 mt-1">{a.author} &mdash; {a.emp_dept}</p>
                </div>
              </div>
              <button
                onClick={() => setDismissed((prev) => new Set([...prev, a.id]))}
                className="text-gray-500 hover:text-gray-700 transition-colors ml-4"
              >
                <X size={20} />
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
