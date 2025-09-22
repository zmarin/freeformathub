import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Monitor,
  Tablet,
  Smartphone,
  RotateCcw,
  Wifi,
  Battery,
  Signal,
  Home,
  ArrowLeft,
  Menu,
  MoreVertical,
  Maximize2,
  ZoomIn,
  ZoomOut,
  RefreshCw,
  ExternalLink,
  Share2,
  Download,
  MousePointer,
  Fingerprint
} from 'lucide-react';

export type DeviceType = 'desktop' | 'tablet' | 'mobile';
export type DeviceOrientation = 'portrait' | 'landscape';

export interface DeviceSpecs {
  name: string;
  width: number;
  height: number;
  pixelRatio: number;
  userAgent: string;
  hasNotch?: boolean;
  cornerRadius?: number;
}

export interface DeviceFrameProps {
  deviceType: DeviceType;
  orientation: DeviceOrientation;
  children: React.ReactNode;
  onDeviceChange?: (deviceType: DeviceType) => void;
  onOrientationChange?: (orientation: DeviceOrientation) => void;
  zoom?: number;
  onZoomChange?: (zoom: number) => void;
  showFrame?: boolean;
  showStatusBar?: boolean;
  className?: string;
}

// Device specifications
const DEVICE_SPECS: Record<DeviceType, Record<string, DeviceSpecs>> = {
  desktop: {
    'MacBook Pro': {
      name: 'MacBook Pro 16"',
      width: 1728,
      height: 1117,
      pixelRatio: 2,
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    },
    'Desktop HD': {
      name: 'Desktop 1920x1080',
      width: 1920,
      height: 1080,
      pixelRatio: 1,
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    },
    'Desktop 4K': {
      name: 'Desktop 4K',
      width: 3840,
      height: 2160,
      pixelRatio: 2,
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }
  },
  tablet: {
    'iPad Pro': {
      name: 'iPad Pro 12.9"',
      width: 1024,
      height: 1366,
      pixelRatio: 2,
      userAgent: 'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
      cornerRadius: 12
    },
    'iPad Air': {
      name: 'iPad Air',
      width: 820,
      height: 1180,
      pixelRatio: 2,
      userAgent: 'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
      cornerRadius: 12
    },
    'Galaxy Tab': {
      name: 'Samsung Galaxy Tab S8',
      width: 800,
      height: 1280,
      pixelRatio: 2.5,
      userAgent: 'Mozilla/5.0 (Linux; Android 12; SM-X700) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      cornerRadius: 8
    }
  },
  mobile: {
    'iPhone 15 Pro': {
      name: 'iPhone 15 Pro',
      width: 393,
      height: 852,
      pixelRatio: 3,
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
      hasNotch: true,
      cornerRadius: 20
    },
    'iPhone SE': {
      name: 'iPhone SE',
      width: 375,
      height: 667,
      pixelRatio: 2,
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
      cornerRadius: 6
    },
    'Galaxy S23': {
      name: 'Samsung Galaxy S23',
      width: 360,
      height: 780,
      pixelRatio: 3,
      userAgent: 'Mozilla/5.0 (Linux; Android 13; SM-S911B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
      cornerRadius: 12
    },
    'Pixel 8': {
      name: 'Google Pixel 8',
      width: 412,
      height: 915,
      pixelRatio: 2.6,
      userAgent: 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
      cornerRadius: 16
    }
  }
};

export const DeviceFrame: React.FC<DeviceFrameProps> = ({
  deviceType,
  orientation,
  children,
  onDeviceChange,
  onOrientationChange,
  zoom = 1,
  onZoomChange,
  showFrame = true,
  showStatusBar = true,
  className = ''
}) => {
  const [selectedDevice, setSelectedDevice] = useState('iPhone 15 Pro');
  const [isInteractionMode, setIsInteractionMode] = useState<'mouse' | 'touch'>('mouse');
  const [showDeviceSelector, setShowDeviceSelector] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  const frameRef = useRef<HTMLDivElement>(null);

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // Set default device based on type
  useEffect(() => {
    const devices = Object.keys(DEVICE_SPECS[deviceType]);
    if (devices.length > 0 && !devices.includes(selectedDevice)) {
      setSelectedDevice(devices[0]);
    }
  }, [deviceType, selectedDevice]);

  const currentDevice = DEVICE_SPECS[deviceType][selectedDevice];

  if (!currentDevice) {
    return <div>Device not found</div>;
  }

  const getDeviceDimensions = useCallback(() => {
    const { width, height } = currentDevice;
    if (orientation === 'landscape') {
      return { width: height, height: width };
    }
    return { width, height };
  }, [currentDevice, orientation]);

  const { width, height } = getDeviceDimensions();

  const handleRotate = useCallback(() => {
    const newOrientation = orientation === 'portrait' ? 'landscape' : 'portrait';
    onOrientationChange?.(newOrientation);
  }, [orientation, onOrientationChange]);

  const handleZoomIn = useCallback(() => {
    const newZoom = Math.min(zoom + 0.1, 2);
    onZoomChange?.(newZoom);
  }, [zoom, onZoomChange]);

  const handleZoomOut = useCallback(() => {
    const newZoom = Math.max(zoom - 0.1, 0.3);
    onZoomChange?.(newZoom);
  }, [zoom, onZoomChange]);

  const handleResetZoom = useCallback(() => {
    onZoomChange?.(1);
  }, [onZoomChange]);

  const renderStatusBar = () => {
    if (!showStatusBar || deviceType === 'desktop') return null;

    const time = currentTime.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });

    return (
      <div style={{
        position: 'absolute',
        top: currentDevice.hasNotch ? '12px' : '0',
        left: 0,
        right: 0,
        height: '28px',
        backgroundColor: deviceType === 'mobile' ? 'rgba(0, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(20px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 16px',
        fontSize: '14px',
        fontWeight: 600,
        color: deviceType === 'mobile' ? '#fff' : '#000',
        zIndex: 100,
        borderTopLeftRadius: currentDevice.cornerRadius,
        borderTopRightRadius: currentDevice.cornerRadius
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>{time}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Signal size={14} />
          <Wifi size={14} />
          <Battery size={14} />
        </div>
      </div>
    );
  };

  const renderNavigationBar = () => {
    if (deviceType === 'desktop') return null;

    return (
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '44px',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(20px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
        borderBottomLeftRadius: currentDevice.cornerRadius,
        borderBottomRightRadius: currentDevice.cornerRadius,
        borderTop: '1px solid rgba(0, 0, 0, 0.1)',
        zIndex: 100
      }}>
        <button style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
          <ArrowLeft size={20} color="#000" />
        </button>
        <button style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
          <Home size={20} color="#000" />
        </button>
        <button style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
          <Menu size={20} color="#000" />
        </button>
      </div>
    );
  };

  const renderDeviceFrame = () => {
    if (!showFrame) return null;

    const frameStyle: React.CSSProperties = {
      position: 'absolute',
      top: '-20px',
      left: '-20px',
      right: '-20px',
      bottom: '-20px',
      background: deviceType === 'mobile'
        ? 'linear-gradient(145deg, #2c3e50, #34495e)'
        : deviceType === 'tablet'
        ? 'linear-gradient(145deg, #95a5a6, #bdc3c7)'
        : 'linear-gradient(145deg, #ecf0f1, #bdc3c7)',
      borderRadius: (currentDevice.cornerRadius || 0) + 20,
      boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
      zIndex: -1
    };

    return <div style={frameStyle} />;
  };

  const renderControlBar = () => (
    <div style={{
      position: 'absolute',
      top: '-60px',
      left: 0,
      right: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '1rem',
      backgroundColor: 'var(--color-surface)',
      border: '1px solid var(--color-border)',
      borderRadius: 'var(--radius-md)',
      padding: '0.5rem 1rem',
      fontSize: '0.875rem'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <button
          onClick={() => onDeviceChange?.('desktop')}
          className={`btn ${deviceType === 'desktop' ? 'btn-primary' : 'btn-outline'}`}
          style={{ padding: '0.25rem 0.5rem' }}
        >
          <Monitor size={14} />
        </button>
        <button
          onClick={() => onDeviceChange?.('tablet')}
          className={`btn ${deviceType === 'tablet' ? 'btn-primary' : 'btn-outline'}`}
          style={{ padding: '0.25rem 0.5rem' }}
        >
          <Tablet size={14} />
        </button>
        <button
          onClick={() => onDeviceChange?.('mobile')}
          className={`btn ${deviceType === 'mobile' ? 'btn-primary' : 'btn-outline'}`}
          style={{ padding: '0.25rem 0.5rem' }}
        >
          <Smartphone size={14} />
        </button>

        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowDeviceSelector(!showDeviceSelector)}
            className="btn btn-outline"
            style={{ padding: '0.25rem 0.5rem' }}
          >
            {selectedDevice} <MoreVertical size={12} />
          </button>

          {showDeviceSelector && (
            <div style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              marginTop: '0.25rem',
              backgroundColor: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              padding: '0.5rem',
              minWidth: '200px',
              zIndex: 10,
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
            }}>
              {Object.entries(DEVICE_SPECS[deviceType]).map(([key, device]) => (
                <button
                  key={key}
                  onClick={() => {
                    setSelectedDevice(key);
                    setShowDeviceSelector(false);
                  }}
                  className={`btn ${selectedDevice === key ? 'btn-primary' : 'btn-ghost'}`}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    fontSize: '0.75rem',
                    justifyContent: 'flex-start',
                    marginBottom: '0.25rem'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600 }}>{device.name}</div>
                    <div style={{ fontSize: '0.625rem', opacity: 0.7 }}>
                      {device.width} × {device.height} ({device.pixelRatio}x)
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        {deviceType !== 'desktop' && (
          <button
            onClick={handleRotate}
            className="btn btn-outline"
            style={{ padding: '0.25rem 0.5rem' }}
            title="Rotate device"
          >
            <RotateCcw size={14} />
          </button>
        )}

        <button
          onClick={() => setIsInteractionMode(isInteractionMode === 'mouse' ? 'touch' : 'mouse')}
          className={`btn ${isInteractionMode === 'touch' ? 'btn-primary' : 'btn-outline'}`}
          style={{ padding: '0.25rem 0.5rem' }}
          title={`${isInteractionMode === 'touch' ? 'Touch' : 'Mouse'} mode`}
        >
          {isInteractionMode === 'touch' ? <Fingerprint size={14} /> : <MousePointer size={14} />}
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          <button
            onClick={handleZoomOut}
            className="btn btn-outline"
            style={{ padding: '0.25rem 0.5rem' }}
            title="Zoom out"
          >
            <ZoomOut size={12} />
          </button>
          <span style={{ fontSize: '0.75rem', minWidth: '3rem', textAlign: 'center' }}>
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={handleZoomIn}
            className="btn btn-outline"
            style={{ padding: '0.25rem 0.5rem' }}
            title="Zoom in"
          >
            <ZoomIn size={12} />
          </button>
          <button
            onClick={handleResetZoom}
            className="btn btn-outline"
            style={{ padding: '0.25rem 0.5rem' }}
            title="Reset zoom"
          >
            <RefreshCw size={12} />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className={`device-frame-container ${className}`} style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '80px 20px 20px',
      backgroundColor: 'var(--color-surface-secondary)',
      minHeight: '600px',
      position: 'relative',
      overflow: 'auto'
    }}>
      {renderControlBar()}

      <div
        ref={frameRef}
        className={`device-frame device-${deviceType} ${isInteractionMode === 'touch' ? 'touch-mode' : 'mouse-mode'}`}
        style={{
          position: 'relative',
          width: `${width}px`,
          height: `${height}px`,
          transform: `scale(${zoom})`,
          transformOrigin: 'center center',
          transition: 'transform 0.3s ease',
          borderRadius: currentDevice.cornerRadius,
          overflow: 'hidden',
          backgroundColor: '#fff',
          boxShadow: showFrame
            ? '0 10px 30px rgba(0, 0, 0, 0.2)'
            : '0 2px 10px rgba(0, 0, 0, 0.1)',
          cursor: isInteractionMode === 'touch' ? 'default' : 'auto'
        }}
      >
        {renderDeviceFrame()}
        {renderStatusBar()}

        <div style={{
          position: 'absolute',
          top: showStatusBar && deviceType !== 'desktop' ? '28px' : '0',
          left: 0,
          right: 0,
          bottom: deviceType !== 'desktop' ? '44px' : '0',
          overflow: 'hidden',
          backgroundColor: '#fff'
        }}>
          {children}
        </div>

        {renderNavigationBar()}

        {/* Notch for devices that have it */}
        {currentDevice.hasNotch && orientation === 'portrait' && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: '50%',
            transform: 'translateX(-50%)',
            width: '150px',
            height: '30px',
            backgroundColor: '#000',
            borderBottomLeftRadius: '15px',
            borderBottomRightRadius: '15px',
            zIndex: 200
          }} />
        )}
      </div>

      {/* Click outside to close device selector */}
      {showDeviceSelector && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 5
          }}
          onClick={() => setShowDeviceSelector(false)}
        />
      )}
    </div>
  );
};

export default DeviceFrame;