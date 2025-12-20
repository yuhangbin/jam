export const PlayTriangle = ({ className = "w-8 h-8", fill = "currentColor" }) => (
    <svg viewBox="0 0 24 24" className={className} fill={fill}>
        <path d="M8 5v14l11-7z" />
    </svg>
);
export const PauseIcon = ({ className = "w-8 h-8", fill = "currentColor" }) => (
    <svg viewBox="0 0 24 24" className={className} fill={fill}>
        <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
    </svg>
);
export const StopSquare = ({ className = "w-8 h-8", fill = "currentColor" }) => (
    <svg viewBox="0 0 24 24" className={className} fill={fill}>
        <rect x="6" y="6" width="12" height="12" />
    </svg>
);

export const RecordCircle = ({ className = "w-8 h-8", fill = "currentColor" }) => (
    <svg viewBox="0 0 24 24" className={className} fill={fill}>
        <circle cx="12" cy="12" r="8" />
    </svg>
);

export const UploadIcon = ({ className = "w-5 h-5", strokeWidth = 1.5 }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={strokeWidth} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
    </svg>
);
