'use client';

import React, { useState, ChangeEvent, useRef } from 'react';
import { Upload, Camera, Sparkles, Image as ImageIcon, Download, RefreshCw, User, Users, History } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { motion } from 'framer-motion';
import Link from 'next/link'

interface APIResponse {
  result_url: string;
  face_count: number;
  target_used?: string;
  message: string;
}

const FaceSwapComponent = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>('');
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [faceCount, setFaceCount] = useState<number>(0);
  const [targetType, setTargetType] = useState<string>('default');
  const [targetUsed, setTargetUsed] = useState<string>('');
  const [showCamera, setShowCamera] = useState<boolean>(false);
  const [cameraMode, setCameraMode] = useState<string>('user'); // 'user' untuk depan, 'environment' untuk belakang
  const [showTemplate, setShowTemplate] = useState<boolean>(false);
  const [currentTemplate, setCurrentTemplate] = useState<string>('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleFileSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type.startsWith('image/')) {
        setSelectedFile(file);
        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result;
          if (typeof result === 'string') {
            setPreview(result);
          }
        };
        reader.readAsDataURL(file);
        setError('');
      } else {
        setError('Mohon upload file gambar yang valid (JPG, PNG)');
      }
    }
  };

  const startCamera = async () => {
    setShowCamera(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: cameraMode 
        } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      setError('Tidak dapat mengakses kamera. Pastikan izin kamera diberikan.');
      setShowCamera(false);
    }
  };

  const toggleCamera = async () => {
    // Hentikan stream kamera yang sedang berjalan
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      const tracks = stream.getTracks();
      tracks.forEach(track => track.stop());
    }
    
    // Ubah mode kamera
    const newMode = cameraMode === 'user' ? 'environment' : 'user';
    setCameraMode(newMode);
    
    // Mulai ulang kamera dengan mode baru
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: newMode 
        } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      setError('Tidak dapat mengakses kamera. Pastikan izin kamera diberikan.');
    }
  };

  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      // Set canvas size to match video dimensions
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Draw current video frame to canvas
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Convert canvas to file
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], "camera-capture.jpg", { type: "image/jpeg" });
          setSelectedFile(file);
          
          // Create preview
          const reader = new FileReader();
          reader.onloadend = () => {
            const result = reader.result;
            if (typeof result === 'string') {
              setPreview(result);
            }
          };
          reader.readAsDataURL(file);
          
          // Stop camera stream
          stopCamera();
        }
      }, "image/jpeg");
    }
  };
  
  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      const tracks = stream.getTracks();
      
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    
    setShowCamera(false);
  };

  const handleTargetTypeChange = (type: string) => {
    setTargetType(type);
    if (type === 'default') {
      setShowTemplate(false);
      setCurrentTemplate('');
    } else {
      setShowTemplate(true);
      // Set the correct template based on target type
      if (type === 'female') {
        setCurrentTemplate('/assets/AI_CBI_Female.png');
      } else if (type === 'male') {
        setCurrentTemplate('/assets/AI_CBI_Male.png');
      } else if (type === 'muslimah') {
        setCurrentTemplate('/assets/AI_CBI_Muslimah.png');
      }
    }
  };

  const handleSubmit = async () => {
    if (!selectedFile) {
      setError('Silakan pilih gambar terlebih dahulu');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const formData = new FormData();
      formData.append('source_image', selectedFile);
      
      // Hanya kirim target_type jika bukan default
      if (targetType !== 'default') {
        formData.append('target_type', targetType);
      }

      const response = await fetch('https://portal2.incoe.astra.co.id/api/face-swap', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Face swap gagal');
      }

      const data: APIResponse = await response.json();
      setResult(data.result_url);
      setFaceCount(data.face_count);
      setTargetUsed(data.target_used || '');

    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Terjadi kesalahan yang tidak diketahui');
      }
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedFile(null);
    setPreview('');
    setResult('');
    setError('');
    setFaceCount(0);
    setTargetType('default');
    setTargetUsed('');
    setShowTemplate(false);
    setCurrentTemplate('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white py-12">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header Section with History Link */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="flex justify-end mb-4">
            <Link 
              href="/history-generate" 
              className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-lg text-blue-400 transition-colors"
            >
              <History className="w-5 h-5" />
              <span>History</span>
            </Link>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600">
            AI Face Swap Generator
          </h1>
          <p className="mt-4 text-gray-400">Transform your photos with advanced AI technology</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Left Panel - Upload Section */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            {/* Camera stream (conditionally rendered) */}
            {showCamera && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gray-800 rounded-xl p-6 border border-gray-700"
              >
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold flex items-center">
                    <Camera className="w-5 h-5 mr-2 text-blue-400" />
                    Camera
                  </h2>
                  <div className="flex space-x-2">
                    <button 
                      onClick={toggleCamera}
                      className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                      {cameraMode === 'user' ? 'Kamera Belakang' : 'Kamera Depan'}
                    </button>
                    <button 
                      onClick={captureImage}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                      Capture
                    </button>
                  </div>
                </div>
                <video 
                  ref={videoRef}
                  autoPlay 
                  playsInline 
                  className="w-full rounded-lg"
                />
                <canvas ref={canvasRef} className="hidden" />
                <button 
                  onClick={stopCamera}
                  className="mt-4 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg w-full transition-colors"
                >
                  Tutup Kamera
                </button>
              </motion.div>
            )}

            {/* Input options (Upload or Camera) - Only shown when camera is not active */}
            {!showCamera && (
              <div className="bg-gray-800 rounded-xl p-8 border border-gray-700 hover:border-blue-500 transition-all">
                <div className="grid grid-cols-2 gap-4">
                  {/* Upload button */}
                  <div>
                    <input
                      type="file"
                      onChange={handleFileSelect}
                      accept="image/*"
                      className="hidden"
                      id="file-upload"
                    />
                    <label
                      htmlFor="file-upload"
                      className="flex flex-col items-center cursor-pointer space-y-4 h-full"
                    >
                      <div className="w-16 h-16 rounded-full bg-blue-600/20 flex items-center justify-center">
                        <Upload className="w-7 h-7 text-blue-400" />
                      </div>
                      <span className="text-lg font-semibold text-gray-300">
                        Upload Image
                      </span>
                    </label>
                  </div>

                  {/* Camera button */}
                  <div>
                    <button
                      onClick={startCamera}
                      className="flex flex-col items-center cursor-pointer space-y-4 w-full h-full"
                    >
                      <div className="w-16 h-16 rounded-full bg-purple-600/20 flex items-center justify-center">
                        <Camera className="w-7 h-7 text-purple-400" />
                      </div>
                      <span className="text-lg font-semibold text-gray-300">
                        Open Camera
                      </span>
                    </button>
                  </div>
                </div>
                <p className="text-sm text-center text-gray-500 mt-6">
                  Supports JPG, PNG (max 5 faces)
                </p>
              </div>
            )}

            {/* Preview Section */}
            {preview && !showCamera && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gray-800 rounded-xl p-6"
              >
                <h2 className="text-xl font-semibold mb-4 flex items-center">
                  <ImageIcon className="w-5 h-5 mr-2 text-blue-400" />
                  Source Image
                </h2>
                <img
                  src={preview}
                  alt="Preview"
                  className="w-full rounded-lg shadow-lg"
                />
              </motion.div>
            )}
            
            {/* Target Selection (Only shown when preview is available) */}
            {preview && !showCamera && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gray-800 rounded-xl p-6"
              >
                <h2 className="text-xl font-semibold mb-4 flex items-center">
                  <User className="w-5 h-5 mr-2 text-blue-400" />
                  Select Target Style (for single face)
                </h2>
                <div className="grid grid-cols-2 gap-3">
                  <label className={`border rounded-lg p-3 flex flex-col items-center cursor-pointer transition-all ${
                    targetType === 'default' ? 'border-blue-500 bg-blue-900/20' : 'border-gray-700 hover:border-gray-500'
                  }`}>
                    <input 
                      type="radio" 
                      name="targetType" 
                      value="default" 
                      checked={targetType === 'default'}
                      onChange={() => handleTargetTypeChange('default')}
                      className="sr-only"
                    />
                    <div className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center mb-2">
                      <Camera className="w-6 h-6 text-gray-300" />
                    </div>
                    <span className="text-sm font-medium">Default</span>
                  </label>
                  
                  <label className={`border rounded-lg p-3 flex flex-col items-center cursor-pointer transition-all ${
                    targetType === 'female' ? 'border-blue-500 bg-blue-900/20' : 'border-gray-700 hover:border-gray-500'
                  }`}>
                    <input 
                      type="radio" 
                      name="targetType" 
                      value="female" 
                      checked={targetType === 'female'}
                      onChange={() => handleTargetTypeChange('female')}
                      className="sr-only"
                    />
                    <div className="w-12 h-12 rounded-full bg-purple-600/30 flex items-center justify-center mb-2">
                      <User className="w-6 h-6 text-pink-300" />
                    </div>
                    <span className="text-sm font-medium">Female</span>
                  </label>
                  
                  <label className={`border rounded-lg p-3 flex flex-col items-center cursor-pointer transition-all ${
                    targetType === 'male' ? 'border-blue-500 bg-blue-900/20' : 'border-gray-700 hover:border-gray-500'
                  }`}>
                    <input 
                      type="radio" 
                      name="targetType" 
                      value="male" 
                      checked={targetType === 'male'}
                      onChange={() => handleTargetTypeChange('male')}
                      className="sr-only"
                    />
                    <div className="w-12 h-12 rounded-full bg-blue-600/30 flex items-center justify-center mb-2">
                      <User className="w-6 h-6 text-blue-300" />
                    </div>
                    <span className="text-sm font-medium">Male</span>
                  </label>
                  
                  <label className={`border rounded-lg p-3 flex flex-col items-center cursor-pointer transition-all ${
                    targetType === 'muslimah' ? 'border-blue-500 bg-blue-900/20' : 'border-gray-700 hover:border-gray-500'
                  }`}>
                    <input 
                      type="radio" 
                      name="targetType" 
                      value="muslimah" 
                      checked={targetType === 'muslimah'}
                      onChange={() => handleTargetTypeChange('muslimah')}
                      className="sr-only"
                    />
                    <div className="w-12 h-12 rounded-full bg-green-600/30 flex items-center justify-center mb-2">
                      <User className="w-6 h-6 text-green-300" />
                    </div>
                    <span className="text-sm font-medium">Muslimah</span>
                  </label>
                </div>
                <p className="text-xs text-gray-500 mt-3">
                  *Style selection will only apply when a single face is detected
                </p>
              </motion.div>
            )}

            {/* Template Preview Section */}
            {showTemplate && !showCamera && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gray-800 rounded-xl p-6"
              >
                <h2 className="text-xl font-semibold mb-4 flex items-center">
                  <ImageIcon className="w-5 h-5 mr-2 text-purple-400" />
                  Template Preview
                </h2>
                <img
                  src={currentTemplate}
                  alt="Template Preview"
                  className="w-full rounded-lg shadow-lg"
                />
                <p className="text-xs text-gray-400 mt-3 text-center">
                  This is how your face will be styled
                </p>
              </motion.div>
            )}
          </motion.div>

          {/* Right Panel - Result Section */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            {/* Generate Button - Only show when not in camera mode and an image is selected */}
            {!showCamera && selectedFile && (
              <button
                onClick={handleSubmit}
                disabled={!selectedFile || loading}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 px-6 rounded-xl
                        font-semibold hover:from-blue-700 hover:to-purple-700 disabled:opacity-50
                        disabled:cursor-not-allowed transition-all duration-300
                        flex items-center justify-center gap-3 shadow-lg"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-6 h-6 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-6 h-6" />
                    <span>Generate Face Swap</span>
                  </>
                )}
              </button>
            )}

            {/* Result Display */}
            {result && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-gray-800 rounded-xl p-6 border border-gray-700"
              >
                <h2 className="text-xl font-semibold mb-4 flex items-center justify-between">
                  <span className="flex items-center">
                    <Sparkles className="w-5 h-5 mr-2 text-purple-400" />
                    Generated Result
                  </span>
                  <div className="flex flex-col items-end">
                    <span className="text-sm text-purple-400">
                      {faceCount} {faceCount > 1 ? 'faces' : 'face'} detected
                    </span>
                    {targetUsed && (
                      <span className="text-xs text-gray-400">
                        Using: {targetUsed}
                      </span>
                    )}
                  </div>
                </h2>
                <img
                  src={result}
                  alt="Face Swap Result"
                  className="w-full rounded-lg shadow-lg mb-4"
                />
                <div className="flex gap-4">
                  <a
                    href={result}
                    download="face-swap-result.jpg"
                    className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-3 px-4 rounded-lg
                             flex items-center justify-center gap-2 transition-colors"
                  >
                    <Download className="w-5 h-5" />
                    Download Result
                  </a>
                  <button
                    onClick={resetForm}
                    className="px-4 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                  >
                    <RefreshCw className="w-5 h-5" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Alert variant="destructive" className="bg-red-900/50 border border-red-800">
                  <AlertDescription className="text-red-200">{error}</AlertDescription>
                </Alert>
              </motion.div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default FaceSwapComponent;