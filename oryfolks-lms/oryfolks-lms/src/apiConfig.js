const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";

export const getMediaUrl = (url) => {
    if (!url) return '';
    if (typeof url !== 'string') return url;
    
    // If URL contains MinIO, AWS S3, or lms-videos path, convert to backend media proxy endpoint
    if (url.includes('49.205.66.47:9000') || url.includes('amazonaws.com') || url.includes('/lms-videos/')) {
        let key = url;
        if (key.includes('/lms-videos/')) {
            key = key.substring(key.indexOf('/lms-videos/') + 12);
        } else if (key.includes('http://') || key.includes('https://')) {
            const parts = key.split('/');
            key = parts.slice(3).join('/');
        }
        return `${API_BASE_URL}/media/${key}`;
    }
    
    return url;
};

export default API_BASE_URL;



