
import React, { useEffect } from 'react';

interface PerformanceMonitorProps {
  children: React.ReactNode;
}

const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({ children }) => {
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      // Monitor component mount time
      const startTime = performance.now();
      
      return () => {
        const endTime = performance.now();
        console.log(`Component render time: ${endTime - startTime}ms`);
      };
    }
  }, []);

  useEffect(() => {
    // Monitor memory usage in development
    if (process.env.NODE_ENV === 'development' && 'memory' in performance) {
      const logMemoryUsage = () => {
        const memory = (performance as any).memory;
        console.log('Memory usage:', {
          used: `${Math.round(memory.usedJSHeapSize / 1048576)} MB`,
          total: `${Math.round(memory.totalJSHeapSize / 1048576)} MB`,
          limit: `${Math.round(memory.jsHeapSizeLimit / 1048576)} MB`,
        });
      };

      const interval = setInterval(logMemoryUsage, 30000); // Log every 30 seconds
      return () => clearInterval(interval);
    }
  }, []);

  return <>{children}</>;
};

export default PerformanceMonitor;
