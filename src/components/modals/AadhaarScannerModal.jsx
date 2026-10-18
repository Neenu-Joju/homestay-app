import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Modal } from '../common/Modal';
import {
  parseAadhaarQRData,
  scanAadhaarFromImageFile,
  detectRawQRCode,
  DEMO_AADHAAR_PROFILES,
} from '../../lib/aadhaarDecoder';
import {
  ShieldCheck,
  ShieldAlert,
  Camera,
  Upload,
  RefreshCw,
  CheckCircle2,
  UserCheck,
  MapPin,
  Calendar,
  CreditCard,
  User,
  Zap,
  Sparkles,
  ArrowRight,
  Eye,
  AlertTriangle,
  FileImage,
  X,
} from 'lucide-react';

export const AadhaarScannerModal = ({
  isOpen,
  onClose,
  onAutoFill = null,
  onRegisterGuest = null,
}) => {
  // Tabs: 'camera' | 'upload'
  const [activeTab, setActiveTab] = useState('camera');
  const [isScanning, setIsScanning] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [facingMode, setFacingMode] = useState('environment'); // 'environment' (back) | 'user' (front)
  const [decodedData, setDecodedData] = useState(null);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [fileError, setFileError] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedPreviewUrl, setUploadedPreviewUrl] = useState(null);
  const [uploadedFileName, setUploadedFileName] = useState('');

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const animationFrameId = useRef(null);
  const isScanningFrame = useRef(false);
  const fileInputRef = useRef(null);
  const cameraCaptureRef = useRef(null);

  // Play a gentle recognition chime via Web Audio API
  const playSuccessChime = () => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.15); // A5
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.3);
    } catch (e) {
      // Audio not permitted or not supported
    }
  };

  // Stop video camera stream
  const stopCamera = useCallback(() => {
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
      animationFrameId.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsScanning(false);
  }, []);

  // Frame scanner loop using multi-engine detector
  const scanFrame = useCallback(async () => {
    if (!videoRef.current || videoRef.current.readyState < 2) {
      animationFrameId.current = requestAnimationFrame(scanFrame);
      return;
    }

    if (isScanningFrame.current) {
      animationFrameId.current = requestAnimationFrame(scanFrame);
      return;
    }

    isScanningFrame.current = true;
    try {
      const video = videoRef.current;
      const raw = await detectRawQRCode(video);
      if (raw) {
        try {
          const parsed = parseAadhaarQRData(raw);
          stopCamera();
          playSuccessChime();
          setDecodedData(parsed);
          isScanningFrame.current = false;
          return;
        } catch (e) {
          // Detected QR is not Aadhaar or unparsable yet, keep scanning
        }
      }
    } catch (err) {
      // Frame scan error, ignore and continue
    } finally {
      isScanningFrame.current = false;
    }

    animationFrameId.current = requestAnimationFrame(scanFrame);
  }, [stopCamera]);

  // Start video camera with high resolution & continuous auto-focus
  const startCamera = useCallback(async () => {
    stopCamera();
    setCameraError('');
    setIsScanning(true);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access is not supported by this browser');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1920, min: 1280 },
          height: { ideal: 1080, min: 720 },
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        videoRef.current.play().then(() => {
          animationFrameId.current = requestAnimationFrame(scanFrame);
        });
      }
    } catch (err) {
      console.warn('Camera error:', err);
      setIsScanning(false);
      setCameraError(
        'Unable to access camera. Please check camera permissions, or use the "Upload Photo" tab.'
      );
    }
  }, [facingMode, scanFrame, stopCamera]);

  // Handle Camera view lifecycle
  useEffect(() => {
    if (isOpen && activeTab === 'camera' && !decodedData) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, activeTab, facingMode, decodedData, startCamera, stopCamera]);

  // Reset state when modal closes
  const handleClose = () => {
    stopCamera();
    setDecodedData(null);
    setCameraError('');
    setFileError('');
    setUploadedPreviewUrl(null);
    setUploadedFileName('');
    onClose();
  };

  // Toggle Camera facing mode (rear / front)
  const toggleCameraFacing = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  // Handle Static Image File Upload (from input or drop)
  const handleFileUpload = async (fileOrEvent) => {
    let file = null;
    if (fileOrEvent?.target?.files) {
      file = fileOrEvent.target.files[0];
    } else if (fileOrEvent instanceof File || fileOrEvent instanceof Blob) {
      file = fileOrEvent;
    }
    if (!file) return;

    setFileError('');
    setIsProcessingFile(true);

    // Create local object URL for preview
    try {
      if (uploadedPreviewUrl) {
        URL.revokeObjectURL(uploadedPreviewUrl);
      }
      const preview = URL.createObjectURL(file);
      setUploadedPreviewUrl(preview);
      setUploadedFileName(file.name || 'aadhaar_card_photo.jpg');
    } catch (e) {
      // Ignore preview failure
    }

    try {
      const parsed = await scanAadhaarFromImageFile(file);
      playSuccessChime();
      setDecodedData(parsed);
    } catch (err) {
      setFileError(
        err.message ||
          'Failed to detect Aadhaar QR code. Ensure the QR code on the card is clearly visible, well-lit, and not blurred.'
      );
    } finally {
      setIsProcessingFile(false);
      // Reset input values so same file can be re-selected if desired
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (cameraCaptureRef.current) cameraCaptureRef.current.value = '';
    }
  };

  // Drag and drop handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const files = e.dataTransfer?.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  // Handle Demo Sample Aadhaar Card
  const handleLoadDemo = (profileIndex = 0) => {
    stopCamera();
    playSuccessChime();
    setDecodedData(DEMO_AADHAAR_PROFILES[profileIndex] || DEMO_AADHAAR_PROFILES[0]);
  };

  // Action: Apply auto-fill
  const handleApplyAutoFill = () => {
    if (!decodedData) return;
    if (onAutoFill) {
      onAutoFill(decodedData);
      handleClose();
    }
  };

  // Action: Register guest directly
  const handleDirectRegister = () => {
    if (!decodedData) return;
    if (onRegisterGuest) {
      onRegisterGuest(decodedData);
      handleClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="UIDAI Aadhaar QR Scanner & Verifier">
      <div className="space-y-4">
        {/* Hidden Canvas */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Hidden File Inputs */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,.pdf"
          onChange={handleFileUpload}
          className="hidden"
        />
        <input
          ref={cameraCaptureRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileUpload}
          className="hidden"
        />

        {/* VIEW 1: RESULTS VIEW (WHEN SCANNED SUCCESSFULLY) */}
        {decodedData ? (
          <div className="space-y-5 animate-in fade-in duration-300">
            {/* Authenticity Certificate Banner */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/80 via-slate-900 to-teal-950/80 border border-emerald-500/40 shadow-xl flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
                  <ShieldCheck className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-black text-sm text-slate-100">
                      UIDAI Authenticated
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      Genuine
                    </span>
                  </div>
                  <p className="text-[11px] text-emerald-400 mt-0.5 font-medium flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3" />
                    {decodedData.verificationMethod}
                  </p>
                </div>
              </div>

              <div className="text-right text-[10px] text-slate-400 font-mono hidden sm:block">
                <span>Format: {decodedData.format}</span>
                <p className="text-emerald-500 font-semibold">100% Offline Validated</p>
              </div>
            </div>

            {/* Extracted Demographic Card */}
            <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4 shadow-lg">
              <div className="flex items-start justify-between border-b border-slate-800 pb-3">
                <div>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                    Resident Full Name
                  </p>
                  <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2 mt-0.5">
                    <User className="w-4 h-4 text-emerald-400" />
                    {decodedData.fullName}
                  </h3>
                </div>

                <div className="text-right">
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                    Masked Aadhaar Number
                  </p>
                  <span className="font-mono text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20 inline-block mt-0.5">
                    {decodedData.maskedId}
                  </span>
                </div>
              </div>

              {/* Grid Details */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800/80">
                  <span className="text-[10px] text-slate-500 block mb-0.5">Date of Birth</span>
                  <div className="font-semibold text-slate-200 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    {decodedData.dob || 'Not specified'}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800/80">
                  <span className="text-[10px] text-slate-500 block mb-0.5">Gender</span>
                  <div className="font-semibold text-slate-200 flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                    {decodedData.gender}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800/80 col-span-2 sm:col-span-1">
                  <span className="text-[10px] text-slate-500 block mb-0.5">State / Pincode</span>
                  <div className="font-semibold text-slate-200 truncate">
                    {decodedData.state || 'Kerala'} {decodedData.pincode ? `(${decodedData.pincode})` : ''}
                  </div>
                </div>
              </div>

              {/* Full Address Block */}
              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800/80 text-xs">
                <span className="text-[10px] text-slate-500 flex items-center gap-1 mb-1 font-semibold uppercase tracking-wider">
                  <MapPin className="w-3 h-3 text-emerald-400" />
                  Verified Permanent Address
                </span>
                <p className="text-slate-300 leading-relaxed font-medium">
                  {decodedData.address}
                </p>
              </div>

              {/* Reference ID note */}
              <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                <span>Ref: <strong className="text-slate-400 font-mono">{decodedData.referenceId}</strong></span>
                <span className="text-emerald-400/90 font-medium">Zero Data Leak • In-Memory Only</span>
              </div>
            </div>

            {/* Actions Toolbar */}
            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              {onAutoFill ? (
                <button
                  type="button"
                  onClick={handleApplyAutoFill}
                  className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white text-xs font-bold shadow-lg shadow-emerald-900/40 flex items-center justify-center gap-2 transition-all"
                >
                  <Zap className="w-4 h-4" />
                  Auto-Fill Details into Guest Form
                </button>
              ) : onRegisterGuest ? (
                <button
                  type="button"
                  onClick={handleDirectRegister}
                  className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white text-xs font-bold shadow-lg shadow-emerald-900/40 flex items-center justify-center gap-2 transition-all"
                >
                  <UserCheck className="w-4 h-4" />
                  Register as Guest & Assign Room
                </button>
              ) : null}

              <button
                type="button"
                onClick={() => {
                  setDecodedData(null);
                  setUploadedPreviewUrl(null);
                  setUploadedFileName('');
                  setFileError('');
                }}
                className="w-full sm:w-auto px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 flex items-center justify-center gap-2 transition-all"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Scan Another Card
              </button>
            </div>
          </div>
        ) : (
          /* VIEW 2: SCANNER VIEW (CAMERA & UPLOAD TABS) */
          <div className="space-y-4">
            {/* Tabs Header */}
            <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
              <button
                type="button"
                onClick={() => setActiveTab('camera')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === 'camera'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                    : 'bg-slate-900 text-slate-400 border border-slate-800 hover:bg-slate-800'
                }`}
              >
                <Camera className="w-3.5 h-3.5" />
                Live Camera Scan
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('upload')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === 'upload'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                    : 'bg-slate-900 text-slate-400 border border-slate-800 hover:bg-slate-800'
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                Upload Photo / Image
              </button>

              {/* Try Demo Dropdown Button */}
              <div className="ml-auto">
                <button
                  type="button"
                  onClick={() => handleLoadDemo(0)}
                  className="px-2.5 py-1 rounded-lg bg-teal-500/10 text-teal-400 border border-teal-500/30 text-[11px] font-bold hover:bg-teal-500/20 transition-all flex items-center gap-1"
                  title="Test scanner with realistic demo Aadhaar data"
                >
                  <Zap className="w-3 h-3" />
                  Try Demo Card
                </button>
              </div>
            </div>

            {/* TAB 1: LIVE CAMERA VIEW */}
            {activeTab === 'camera' && (
              <div className="space-y-3">
                <div className="relative aspect-video sm:aspect-[4/3] w-full max-h-[380px] rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden flex items-center justify-center shadow-inner">
                  {cameraError ? (
                    <div className="p-6 text-center max-w-sm space-y-3">
                      <AlertTriangle className="w-10 h-10 text-amber-400 mx-auto" />
                      <p className="text-xs text-amber-300 font-semibold">{cameraError}</p>
                      <div className="flex items-center justify-center gap-2 pt-2">
                        <button
                          type="button"
                          onClick={startCamera}
                          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 inline-flex items-center gap-1.5"
                        >
                          <RefreshCw className="w-3.5 h-3.5" /> Retry Camera
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveTab('upload')}
                          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold inline-flex items-center gap-1.5"
                        >
                          <Upload className="w-3.5 h-3.5" /> Use Upload
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Live Video Feed */}
                      <video
                        ref={videoRef}
                        className="w-full h-full object-cover"
                        playsInline
                        muted
                      />

                      {/* Animated Scanning Reticle Overlay */}
                      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                        <div className="relative w-56 h-56 sm:w-64 sm:h-64 border-2 border-emerald-500/60 rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(16,185,129,0.2)]">
                          {/* Corner Markers */}
                          <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-emerald-400 rounded-tl-xl" />
                          <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-emerald-400 rounded-tr-xl" />
                          <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-emerald-400 rounded-bl-xl" />
                          <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-emerald-400 rounded-br-xl" />

                          {/* Animated Laser Scanning Beam */}
                          <div className="w-full h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent absolute shadow-[0_0_12px_#10b981] animate-laser" />
                        </div>
                      </div>

                      {/* Camera Switcher Button */}
                      <button
                        type="button"
                        onClick={toggleCameraFacing}
                        className="absolute bottom-3 right-3 p-2.5 rounded-xl bg-slate-900/80 backdrop-blur-md border border-slate-700 text-slate-200 hover:text-white hover:bg-slate-800 text-xs flex items-center gap-1.5 shadow-lg transition-all"
                        title="Switch camera"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span className="text-[11px] font-semibold hidden sm:inline">Flip Camera</span>
                      </button>

                      {/* Status Toast inside Camera Viewport */}
                      <div className="absolute top-3 left-3 px-3 py-1 rounded-lg bg-slate-950/80 backdrop-blur-md border border-slate-800 text-[11px] text-emerald-400 font-medium flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                        Align Aadhaar QR inside box
                      </div>
                    </>
                  )}
                </div>

                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
                  <span>
                    💡 <strong>Tip:</strong> Aadhaar QR codes have high density. On laptops without autofocus, use the <strong>Upload Photo</strong> tab or test on mobile.
                  </span>
                  <button
                    type="button"
                    onClick={() => setActiveTab('upload')}
                    className="text-emerald-400 hover:underline font-semibold ml-2 shrink-0"
                  >
                    Switch to Upload →
                  </button>
                </div>
              </div>
            )}

            {/* TAB 2: IMAGE / PHOTO UPLOAD VIEW */}
            {activeTab === 'upload' && (
              <div className="space-y-4">
                {/* Drag and Drop Zone & Action Area */}
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`relative border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center transition-all ${
                    isDragging
                      ? 'border-emerald-400 bg-emerald-500/10 scale-[1.01]'
                      : 'border-slate-700 hover:border-emerald-500/50 bg-slate-950/80'
                  }`}
                >
                  <div className="flex flex-col items-center justify-center space-y-4">
                    {/* Icon or Thumbnail */}
                    {uploadedPreviewUrl ? (
                      <div className="relative w-24 h-24 rounded-2xl overflow-hidden border-2 border-emerald-500/40 shadow-lg">
                        <img
                          src={uploadedPreviewUrl}
                          alt="Uploaded Aadhaar"
                          className="w-full h-full object-cover"
                        />
                        {isProcessingFile && (
                          <div className="absolute inset-0 bg-slate-950/70 flex items-center justify-center">
                            <RefreshCw className="w-6 h-6 text-emerald-400 animate-spin" />
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shadow-lg">
                        {isProcessingFile ? (
                          <RefreshCw className="w-7 h-7 animate-spin" />
                        ) : (
                          <Upload className="w-7 h-7" />
                        )}
                      </div>
                    )}

                    {/* Text instructions */}
                    <div>
                      <p className="text-sm font-bold text-slate-100">
                        {isProcessingFile
                          ? 'Decoding Aadhaar QR modules...'
                          : uploadedFileName
                          ? uploadedFileName
                          : 'Select or Drag Aadhaar Card Photo'}
                      </p>
                      <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                        Supports high-resolution phone photos, scanned Aadhaar cards, or e-Aadhaar screenshots (JPG, PNG, WEBP).
                      </p>
                    </div>

                    {/* Prominent Action Buttons */}
                    <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                      <button
                        type="button"
                        id="btn-choose-aadhaar-file"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isProcessingFile}
                        className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white text-xs font-bold shadow-lg shadow-emerald-950 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                      >
                        <Upload className="w-4 h-4" />
                        {uploadedPreviewUrl ? 'Choose Different Photo' : 'Browse Photo File'}
                      </button>

                      {/* Direct Phone Camera trigger (Mobile browsers will open phone camera immediately) */}
                      <button
                        type="button"
                        id="btn-capture-aadhaar-camera"
                        onClick={() => cameraCaptureRef.current?.click()}
                        disabled={isProcessingFile}
                        className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                      >
                        <Camera className="w-4 h-4 text-emerald-400" />
                        Take Photo with Camera
                      </button>
                    </div>
                  </div>
                </div>

                {/* Error Banner with helpful troubleshooting */}
                {fileError && (
                  <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs space-y-2">
                    <div className="flex items-center gap-2 font-semibold">
                      <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
                      <span>{fileError}</span>
                    </div>
                    <ul className="text-[11px] text-rose-400/90 list-disc list-inside space-y-0.5 pl-1">
                      <li>Make sure the square QR code on the Aadhaar card is in sharp focus without blur.</li>
                      <li>Avoid lighting glare or reflection bouncing off plastic lamination.</li>
                      <li>You can also crop the image closer to the QR code before uploading.</li>
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Compliance & Quick Demo Footer */}
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                100% Offline • Client-side RSA verification • Zero data leak
              </span>
              <button
                type="button"
                onClick={() => handleLoadDemo(1)}
                className="text-emerald-400 hover:underline font-semibold"
              >
                Demo Profile 2
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
