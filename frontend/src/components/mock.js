// Mock data for chatbot - will be replaced with actual API calls later
export const mockSessions = [
  {
    id: '1',
    title: 'Diskusi tentang AI',
    createdAt: '2025-01-20T10:00:00Z',
    messages: [
      {
        id: '1',
        type: 'user',
        content: 'Jelaskan tentang kecerdasan buatan',
        timestamp: '2025-01-20T10:00:00Z'
      },
      {
        id: '2',
        type: 'assistant',
        content: 'Kecerdasan buatan (AI) adalah cabang ilmu komputer yang bertujuan menciptakan sistem yang dapat melakukan tugas-tugas yang biasanya memerlukan kecerdasan manusia. AI mencakup pembelajaran mesin, pemrosesan bahasa alami, visi komputer, dan robotika.',
        timestamp: '2025-01-20T10:00:30Z'
      }
    ]
  },
  {
    id: '2',
    title: 'Membuat gambar digital',
    createdAt: '2025-01-20T11:00:00Z',
    messages: [
      {
        id: '3',
        type: 'user',
        content: 'Buatkan gambar pemandangan gunung dengan matahari terbenam',
        timestamp: '2025-01-20T11:00:00Z'
      },
      {
        id: '4',
        type: 'assistant',
        contentType: 'image',
        content: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop',
        prompt: 'pemandangan gunung dengan matahari terbenam',
        timestamp: '2025-01-20T11:00:30Z'
      },
      {
        id: '5',
        type: 'user',
        content: 'Bagus! Bisakah dijelaskan teknik fotografi untuk mengambil foto seperti ini?',
        timestamp: '2025-01-20T11:01:00Z'
      },
      {
        id: '6',
        type: 'assistant',
        content: 'Untuk mengambil foto pemandangan seperti ini, beberapa teknik penting adalah: 1) Gunakan golden hour (1 jam sebelum sunset), 2) Set kamera ke mode manual dengan ISO rendah (100-400), 3) Gunakan tripod untuk stabilitas, 4) Komposisi rule of thirds, 5) Focus stacking untuk ketajaman maksimal dari foreground hingga background.',
        timestamp: '2025-01-20T11:01:30Z'
      }
    ]
  }
];

export const generateMockResponse = (message, type = 'text') => {
  const responses = {
    text: [
      'Itu adalah pertanyaan yang menarik! Berdasarkan analisis saya...',
      'Saya akan menjelaskan hal tersebut secara detail...',
      'Menurut pemahaman saya, hal ini dapat dipahami sebagai...',
      'Izinkan saya memberikan perspektif yang komprehensif...'
    ],
    image: [
      'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800&h=600&fit=crop'
    ]
  };
  
  return responses[type][Math.floor(Math.random() * responses[type].length)];
};