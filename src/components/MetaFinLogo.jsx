

const MetaFinLogo = ({ className = "h-10" }) => (
    <svg viewBox="0 0 200 50" className={className} xmlns="http://www.w3.org/2000/svg">
        {/* Cube cluster */}
        <g>
            {/* Back cube */}
            <polygon points="22,8 34,2 46,8 34,14" fill="hsl(155 80% 40%)" opacity="0.6" />
            <polygon points="22,8 22,20 34,26 34,14" fill="hsl(155 100% 30%)" opacity="0.6" />
            <polygon points="34,14 34,26 46,20 46,8" fill="hsl(155 60% 35%)" opacity="0.6" />
            {/* Front cube */}
            <polygon points="10,18 22,12 34,18 22,24" fill="hsl(155 100% 45%)" />
            <polygon points="10,18 10,30 22,36 22,24" fill="hsl(155 100% 30%)" />
            <polygon points="22,24 22,36 34,30 34,18" fill="hsl(155 80% 35%)" />
            {/* Bottom cube */}
            <polygon points="28,26 40,20 52,26 40,32" fill="hsl(155 80% 40%)" opacity="0.8" />
            <polygon points="28,26 28,38 40,44 40,32" fill="hsl(155 100% 25%)" opacity="0.8" />
            <polygon points="40,32 40,44 52,38 52,26" fill="hsl(155 60% 30%)" opacity="0.8" />
            {/* Circuit lines */}
            <line x1="34" y1="14" x2="34" y2="8" stroke="hsl(155 100% 45%)" strokeWidth="0.8" opacity="0.5" />
            <circle cx="34" cy="7" r="1.2" fill="hsl(155 100% 45%)" opacity="0.5" />
            <line x1="46" y1="8" x2="52" y2="5" stroke="hsl(155 100% 45%)" strokeWidth="0.8" opacity="0.4" />
            <circle cx="52" cy="5" r="1" fill="hsl(155 100% 45%)" opacity="0.4" />
        </g>
        {/* Text "Meta Finance Hub" */}
        <text
            x="62"
            y="26"
            fontFamily="'Plus Jakarta Sans', sans-serif"
            fontWeight="800"
            fontSize="28"
            letterSpacing="-0.02em"
            fill="hsl(155 100% 45%)"
        >
            Meta
        </text>
        <text
            x="62"
            y="42"
            fontFamily="'Inter', sans-serif"
            fontWeight="700"
            fontSize="11"
            letterSpacing="3"
            fill="hsl(160 100% 95%)"
            opacity="0.6"
            style={{ textTransform: 'uppercase' }}
        >
            Finance Hub
        </text>
    </svg>
);

export default MetaFinLogo;
