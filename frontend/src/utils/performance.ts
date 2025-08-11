
export const measurePerformance = (name: string, fn: () => void) => {
  if (process.env.NODE_ENV === 'development') {
    const start = performance.now();
    fn();
    const end = performance.now();
    console.log(`${name} took ${end - start} milliseconds`);
  } else {
    fn();
  }
};

export const reportWebVitals = (metric: any) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(metric);
  }
  // In production, you can send these to analytics
};

export const prefetchRoute = (routeName: string) => {
  // Prefetch critical routes
  const criticalRoutes = ['/dashboard', '/attendance', '/students'];
  if (criticalRoutes.includes(routeName)) {
    import(`../pages/${routeName.charAt(1).toUpperCase() + routeName.slice(2)}`);
  }
};
