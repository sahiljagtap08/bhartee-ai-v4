// src/lib/prompts.ts

export const interviewPrompts = {
    technical: {
      focus: 'System architecture and design principles',
      evaluation: 'Technical depth and decision-making',
      topics: [
        'Distributed systems',
        'Scalability',
        'System design',
        'Architecture patterns',
        'Performance optimization'
      ],
      questionStyle: 'Open-ended architectural discussions'
    },
    
    coding: {
      focus: 'Problem-solving and implementation',
      evaluation: 'Code quality and algorithmic thinking',
      topics: [
        'Data structures',
        'Algorithms',
        'Code optimization',
        'Error handling',
        'Testing approaches'
      ],
      questionStyle: 'Interactive problem-solving'
    },
  
    behavioral: {
      focus: 'Past experiences and soft skills',
      evaluation: 'Communication and decision-making',
      topics: [
        'Team collaboration',
        'Project management',
        'Conflict resolution',
        'Leadership',
        'Problem-solving methodology'
      ],
      questionStyle: 'STAR method scenarios'
    },
  
    frontend: {
      focus: 'UI/UX and frontend architecture',
      evaluation: 'Frontend expertise and best practices',
      topics: [
        'React patterns',
        'State management',
        'Performance optimization',
        'Responsive design',
        'Accessibility'
      ],
      questionStyle: 'Component design scenarios'
    },
  
    backend: {
      focus: 'Server design and API architecture',
      evaluation: 'Backend systems and scalability',
      topics: [
        'API design',
        'Database optimization',
        'System integration',
        'Security practices',
        'Performance monitoring'
      ],
      questionStyle: 'Architecture design scenarios'
    }
  };