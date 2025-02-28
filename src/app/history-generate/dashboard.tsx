'use client';
import React, { useState, useEffect } from 'react';
import { Sparkles, ImageIcon, Download, RefreshCw, House, X } from 'lucide-react';
import Link from 'next/link'

// Define the FaceSwapData interface
interface FaceSwapData {
  CreatedAt: string;
  ResultUrl: string;
}

const FaceSwapComponent = () => {
  const [images, setImages] = useState<FaceSwapData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const fetchFaceSwapData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('https://portal4.incoe.astra.co.id:4433/get_data_faceswap');
      
      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }
      
      const data = await response.json();
      
      // Check if data is null or not an array
      if (!data) {
        console.warn('API returned null data');
        setImages([]);
        return;
      }
      
      // Ensure we have an array, even if the API returned something else
      if (!Array.isArray(data)) {
        console.warn('API did not return an array, received:', typeof data);
        setImages([]);
        return;
      }
      
      // Filter out any items that don't match our expected format
      const validImages = data.filter((item: any) => 
        item && 
        typeof item === 'object' && 
        'CreatedAt' in item && 
        'ResultUrl' in item &&
        typeof item.CreatedAt === 'string' &&
        (item.ResultUrl === null || typeof item.ResultUrl === 'string')
      );
      
      setImages(validImages);
    } catch (err: any) {
      console.error('Error fetching face swap data:', err);
      setError(err.message || 'Failed to fetch data');
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

  const downloadImage = (e: React.MouseEvent, imageData: FaceSwapData, index: number) => {
    e.stopPropagation(); // Prevent opening the popup when clicking download
    
    // Check if ResultUrl exists and is a valid string
    if (!imageData.ResultUrl) {
      console.error('Cannot download: ResultUrl is null or empty');
      return;
    }
    
    const link = document.createElement('a');
    link.href = imageData.ResultUrl;
    link.download = `faceswap-${imageData.CreatedAt?.split('T')[0] || 'image'}-${index}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Function to adjust time by subtracting 7 hours
  const adjustTimeZone = (dateString: string): string => {
    if (!dateString) return 'Unknown date';
    
    try {
      const date = new Date(dateString);
      
      // Check for invalid date
      if (isNaN(date.getTime())) {
        return 'Invalid date';
      }
      
      date.setHours(date.getHours() - 7);
      return date.toLocaleString();
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Date error';
    }
  };

  // Handle click on image to show popup
  const handleImageClick = (imageUrl: string) => {
    if (!imageUrl) return;
    
    setSelectedImage(imageUrl);
    // Prevent scrolling when popup is open
    document.body.style.overflow = 'hidden';
  };

  // Close popup
  const closePopup = () => {
    setSelectedImage(null);
    // Restore scrolling
    document.body.style.overflow = 'auto';
  };

  // Handle keyboard events to close popup with Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedImage) {
        closePopup();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      // Ensure scrolling is restored when component unmounts
      document.body.style.overflow = 'auto';
    };
  }, [selectedImage]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white py-12 flex flex-col">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold flex items-center">
            <Sparkles className="mr-2" size={24} />
            Face Swap Results
          </h1>
          <div className="flex space-x-4">
            <Link 
              href="/home" 
              className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-lg text-blue-400 transition-colors"
            >
              <House className="w-5 h-5" />
              <span>Home</span>
            </Link>
            <button 
              onClick={handleRefresh}
              className="flex items-center bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <RefreshCw className="mr-2" size={16} />
              Refresh
            </button>
          </div>
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

        <div className="overflow-y-auto max-h-[calc(100vh-150px)] pr-2 pb-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {images.map((image, index) => (
              <div 
                key={index} 
                className="bg-gray-800 rounded-lg overflow-hidden shadow-lg"
              >
                <div 
                  className={`relative pt-[100%] bg-gray-700 ${image.ResultUrl ? 'cursor-pointer' : ''}`}
                  onClick={() => image.ResultUrl && handleImageClick(image.ResultUrl)}
                >
                  {image.ResultUrl ? (
                    <img 
                      src={image.ResultUrl} 
                      alt={`Face Swap ${index + 1}`}
                      className="absolute top-0 left-0 w-full h-full object-cover transition-transform hover:scale-105"
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
                        {image.CreatedAt ? adjustTimeZone(image.CreatedAt) : 'Unknown date'}
                      </p>
                    </div>
                    {image.ResultUrl && (
                      <button
                        onClick={(e) => downloadImage(e, image, index)}
                        className="bg-gray-700 hover:bg-gray-600 p-2 rounded-full transition-colors"
                        title="Download Image"
                      >
                        <Download size={16} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Image Popup/Modal */}
      {selectedImage && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4"
          onClick={closePopup}
        >
          <div 
            className="relative max-w-4xl w-full max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()} // Prevent closing when clicking on content
          >
            <button 
              onClick={closePopup}
              className="absolute -top-12 right-0 bg-gray-800 hover:bg-gray-700 p-2 rounded-full text-white transition-colors z-10"
            >
              <X size={24} />
            </button>
            
            <div className="relative bg-gray-900 rounded-lg overflow-hidden w-full h-full">
              <img 
                src={selectedImage} 
                alt="Enlarged Face Swap"
                className="max-h-[80vh] max-w-full mx-auto object-contain"
                onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                  const imgElement = e.currentTarget as HTMLImageElement;
                  imgElement.onerror = null;
                  imgElement.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%23333333'/%3E%3Ctext x='50' y='50' font-family='Arial' font-size='12' fill='%23ffffff' text-anchor='middle' dominant-baseline='middle'%3EImage Load Error%3C/text%3E%3C/svg%3E";
                }}
              />
              
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4">
                <div className="flex justify-end">
                  <a
                    href={selectedImage}
                    download="faceswap-image.jpg"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center transition-colors"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Download size={16} className="mr-2" />
                    Download
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FaceSwapComponent;