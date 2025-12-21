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
export const TrashIcon = ({ className = "w-5 h-5", strokeWidth = 1.5 }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={strokeWidth} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.34 9m-4.78 0-.34-9m9.96-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
    </svg>
);
