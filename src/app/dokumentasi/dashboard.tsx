'use client';
import React, { useState, useEffect } from 'react';
import { Upload, Camera, Sparkles, ImageIcon, Download, RefreshCw, User, Users } from 'lucide-react';

// Define the FaceSwapData interface
interface FaceSwapData {
  CreatedAt: string;
  ResultUrl: string;
}

const FaceSwapComponent = () => {
  const [images, setImages] = useState<FaceSwapData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchFaceSwapData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('https://portal4.incoe.astra.co.id:4433/get_data_faceswap');
      
      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }
      
      const data = await response.json();
      setImages(data);
    } catch (err) {
      console.error('Error fetching face swap data:', err);
      // setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFaceSwapData();
  }, []);

  const handleRefresh = () => {
    fetchFaceSwapData();
  };

  const downloadImage = (imageData: FaceSwapData, index: number) => {
    const link = document.createElement('a');
    link.href = imageData.ResultUrl;
    link.download = `faceswap-${imageData.CreatedAt.split('T')[0]}-${index}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white py-12">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold flex items-center">
            <Sparkles className="mr-2" size={24} />
            Face Swap Results
          </h1>
          <button 
            onClick={handleRefresh}
            className="flex items-center bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <RefreshCw className="mr-2" size={16} />
            Refresh
          </button>
        </div>

        {loading && (
          <div className="flex justify-center items-center my-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        )}

        {error && (
          <div className="bg-red-500 bg-opacity-20 border border-red-500 rounded-lg p-4 mb-6">
            <p className="text-red-300">Error: {error}</p>
            <p className="text-white mt-2">Please check your network connection and try again.</p>
          </div>
        )}

        {!loading && images.length === 0 && !error && (
          <div className="text-center py-16 bg-gray-800 rounded-lg">
            <ImageIcon className="mx-auto h-16 w-16 text-gray-600 mb-4" />
            <h3 className="text-xl font-medium text-gray-300">No images found</h3>
            <p className="text-gray-400 mt-2">Try refreshing or check back later</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {images.map((image, index) => (
            <div key={index} className="bg-gray-800 rounded-lg overflow-hidden shadow-lg">
              <div className="relative pt-[100%] bg-gray-700">
                {image.ResultUrl ? (
                  <img 
                    src={image.ResultUrl} 
                    alt={`Face Swap ${index + 1}`}
                    className="absolute top-0 left-0 w-full h-full object-cover"
                    onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                      const imgElement = e.currentTarget as HTMLImageElement;
                      imgElement.onerror = null;
                      imgElement.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%23333333'/%3E%3Ctext x='50' y='50' font-family='Arial' font-size='12' fill='%23ffffff' text-anchor='middle' dominant-baseline='middle'%3EImage Error%3C/text%3E%3C/svg%3E";
                    }}
                  />
                ) : (
                  <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center bg-gray-700">
                    <ImageIcon className="h-12 w-12 text-gray-500" />
                  </div>
                )}
              </div>
              <div className="p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-gray-400 text-sm">
                      {new Date(image.CreatedAt).toLocaleString()}
                    </p>
                  </div>
                  <button
                    onClick={() => downloadImage(image, index)}
                    className="bg-gray-700 hover:bg-gray-600 p-2 rounded-full transition-colors"
                    title="Download Image"
                  >
                    <Download size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FaceSwapComponent;