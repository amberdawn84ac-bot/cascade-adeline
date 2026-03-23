'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';

interface LearningTrack {
  id: string;
  name: string;
  description: string;
  progress: number;
  color: string;
  icon: string;
  units: string[];
}

const learningTracks: LearningTrack[] = [
  {
    id: 'gods-creation-science',
    name: "God's Creation & Science",
    description: 'Explore the natural world through hands-on experiments and observation',
    progress: 75,
    color: '#2F4731',
    icon: '🌿',
    units: ['Garden Biology', 'Ecosystem Interactions', 'Plant Life Cycles']
  },
  {
    id: 'health-naturopathy',
    name: 'Health & Naturopathy',
    description: 'Learn natural health practices and body wellness',
    progress: 60,
    color: '#2F4731',
    icon: '🌱',
    units: ['Herbal Medicine', 'Nutrition Basics', 'Body Systems']
  },
  {
    id: 'homesteading',
    name: 'Homesteading',
    description: 'Master practical skills for sustainable living',
    progress: 85,
    color: '#2F4731',
    icon: '🏡',
    units: ['Food Preservation', 'Animal Care', 'Building Projects']
  },
  {
    id: 'government-economics',
    name: 'Government & Economics',
    description: 'Understand systems of power and money',
    progress: 45,
    color: '#2F4731',
    icon: '🏛️',
    units: ['Civic Structure', 'Economic Principles', 'Rights & Laws']
  },
  {
    id: 'justice-change-making',
    name: 'Justice & Change-making',
    description: 'Develop skills for creating positive change',
    progress: 70,
    color: '#3D1419',
    icon: '⚖️',
    units: ['Environmental Justice', 'Community Action', 'Advocacy']
  },
  {
    id: 'discipleship-cultural-discernment',
    name: 'Discipleship & Cultural Discernment',
    description: 'Grow in faith and cultural understanding',
    progress: 80,
    color: '#9A3F4A',
    icon: '✝️',
    units: ['Biblical Studies', 'Media Literacy', 'Cultural Analysis']
  },
  {
    id: 'truth-based-history',
    name: 'Truth-Based History',
    description: 'Discover real history through primary sources',
    progress: 55,
    color: '#3D1419',
    icon: '📚',
    units: ['Primary Source Analysis', 'Historical Investigation', 'Timeline Studies']
  },
  {
    id: 'english-language-literature',
    name: 'English Language & Literature',
    description: 'Master communication and literary analysis',
    progress: 90,
    color: '#BD6809',
    icon: '✍️',
    units: ['Creative Writing', 'Literary Analysis', 'Communication Skills']
  }
];

export default function MyLearningPath() {
  const [selectedTrack, setSelectedTrack] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-green-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold text-amber-900 mb-2" style={{ fontFamily: 'Swanky and Moo Moo, cursive' }}>
            My Learning Path
          </h1>
          <p className="text-lg text-amber-700" style={{ fontFamily: 'Kalam, cursive' }}>
            Track your progress across the 8 Integrated Tracks
          </p>
        </motion.div>

        {/* Track Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {learningTracks.map((track, index) => (
            <motion.div
              key={track.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.05 }}
              className="bg-white rounded-lg shadow-lg p-6 cursor-pointer border-2 border-amber-200"
              onClick={() => setSelectedTrack(track.id)}
            >
              <div className="flex items-center mb-4">
                <span className="text-3xl mr-3">{track.icon}</span>
                <h3 className="text-lg font-semibold text-gray-800" style={{ color: track.color }}>
                  {track.name}
                </h3>
              </div>
              
              <p className="text-sm text-gray-600 mb-4">{track.description}</p>
              
              {/* Progress Bar */}
              <div className="mb-2">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Progress</span>
                  <span>{track.progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <motion.div
                    className="h-2 rounded-full"
                    style={{ backgroundColor: track.color }}
                    initial={{ width: 0 }}
                    animate={{ width: `${track.progress}%` }}
                    transition={{ duration: 1, delay: 0.5 + index * 0.1 }}
                  />
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Selected Track Details */}
        {selectedTrack && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg shadow-lg p-8 border-2 border-amber-200"
          >
            {(() => {
              const track = learningTracks.find(t => t.id === selectedTrack);
              if (!track) return null;
              
              return (
                <>
                  <div className="flex items-center mb-6">
                    <span className="text-4xl mr-4">{track.icon}</span>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-800" style={{ color: track.color }}>
                        {track.name}
                      </h2>
                      <p className="text-gray-600">{track.description}</p>
                    </div>
                  </div>
                  
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-3">Units in Progress:</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {track.units.map((unit, unitIndex) => (
                        <motion.div
                          key={unitIndex}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: unitIndex * 0.1 }}
                          className="bg-amber-50 rounded-lg p-4 border border-amber-200"
                        >
                          <h4 className="font-medium text-amber-900">{unit}</h4>
                          <div className="mt-2 text-sm text-amber-700">
                            {unitIndex < track.progress / 33 ? '✅ Completed' : '📚 In Progress'}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex justify-center">
                    <button
                      onClick={() => setSelectedTrack(null)}
                      className="px-6 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
                      style={{ fontFamily: 'Kalam, cursive' }}
                    >
                      Close Details
                    </button>
                  </div>
                </>
              );
            })()}
          </motion.div>
        )}

        {/* Overall Progress Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="bg-white rounded-lg shadow-lg p-6 border-2 border-amber-200"
        >
          <h3 className="text-xl font-bold text-amber-900 mb-4">Overall Progress</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-amber-600">
                {Math.round(learningTracks.reduce((acc, track) => acc + track.progress, 0) / learningTracks.length)}%
              </div>
              <div className="text-sm text-gray-600">Average Progress</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">
                {learningTracks.filter(track => track.progress >= 70).length}/8
              </div>
              <div className="text-sm text-gray-600">Tracks Near Completion</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">
                {learningTracks.reduce((acc, track) => acc + track.units.filter((_, i) => i < track.progress / 33).length, 0)}
              </div>
              <div className="text-sm text-gray-600">Units Completed</div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
