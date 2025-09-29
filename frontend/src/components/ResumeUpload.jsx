import { AlertCircle, CheckCircle, File, Upload } from 'lucide-react';
import React,{ useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import apiService from '../services/api';
import { addCandidate } from '../store/candidatesSlice';
import { clearError, setCollectingMissingInfo, setError, setLoading, setMissingFields, setResumeUploadVisible } from '../store/uiSlice';
import { generateUniqueId, getMissingFields } from '../utils/helpers';
import { validateResumeFile } from '../utils/resumeParser';

const ResumeUpload = () => {
  const dispatch = useDispatch();
  const { error, isLoading } = useSelector(state => state.ui);
  const [dragOver, setDragOver] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileSelect = async (file) => {
    try {
      dispatch(setLoading(true));
      dispatch(clearError());

      // Validate file client-side
      validateResumeFile(file);

      // Create candidate with resume via API
      const candidateData = await apiService.uploadResume(file);
      
      // Check for missing required fields
      const missingFields = getMissingFields(candidateData);
      
      if (missingFields.length > 0) {
        // Store the partial data and prompt for missing fields
        dispatch(addCandidate({
          ...candidateData,
          id: candidateData._id || generateUniqueId(),
          resumeFile: {
            name: file.name,
            size: file.size,
            type: file.type
          }
        }));
        
        dispatch(setMissingFields(missingFields));
        dispatch(setCollectingMissingInfo(true));
        dispatch(setResumeUploadVisible(false));
      } else {
        // All required fields present, create candidate and start interview
        dispatch(addCandidate({
          ...candidateData,
          id: candidateData._id || generateUniqueId(),
          resumeFile: {
            name: file.name,
            size: file.size,
            type: file.type
          }
        }));
        
        dispatch(setResumeUploadVisible(false));
      }

      setUploadedFile(file);
    } catch (error) {
      dispatch(setError(error.message));
    } finally {
      dispatch(setLoading(false));
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleFileInputChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="max-w-md mx-auto p-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Upload Your Resume
        </h2>
        <p className="text-gray-600">
          Please upload your resume to start the interview process
        </p>
      </div>

      <div
        className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragOver
            ? 'border-primary-500 bg-primary-50'
            : 'border-gray-300 hover:border-gray-400'
        } ${isLoading ? 'opacity-50 pointer-events-none' : ''}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={openFileDialog}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.docx"
          onChange={handleFileInputChange}
          className="hidden"
        />

        {isLoading ? (
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mb-3"></div>
            <p className="text-gray-600">Processing your resume...</p>
          </div>
        ) : uploadedFile ? (
          <div className="flex flex-col items-center text-green-600">
            <CheckCircle className="h-12 w-12 mb-3" />
            <p className="font-medium">{uploadedFile.name}</p>
            <p className="text-sm text-gray-500 mt-1">
              {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <Upload className="h-12 w-12 text-gray-400 mb-3" />
            <p className="text-lg font-medium text-gray-700 mb-2">
              Drop your resume here
            </p>
            <p className="text-sm text-gray-500 mb-4">
              or click to browse files
            </p>
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <File className="h-4 w-4" />
              <span>Supports PDF and DOCX files</span>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <div className="mt-6 text-center">
        <p className="text-xs text-gray-500">
          Maximum file size: 10MB • Supported formats: PDF, DOCX
        </p>
      </div>
    </div>
  );
};

export default ResumeUpload;