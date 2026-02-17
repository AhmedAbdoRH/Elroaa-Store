import React from 'react';
import './HerbFacebookButton.css';

interface FacebookButtonProps {
  facebookUrl?: string;
  className?: string;
}

export default function FacebookButton({
  facebookUrl = "https://www.facebook.com/profile.php?id=61573723094947&rdid=1ZVjWRSfc8eMXGJA&share_url=https%3A%2F%2Fwww.facebook.com%2Fshare%2F1ZM6ocoHPf%2F#",
  className = ""
}: FacebookButtonProps) {
  const handleClick = () => {
    window.open(facebookUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className={`flex justify-center my-12 ${className}`}>
      <div className="fb-herb-container">
        <button
          className="fb-btn-premium"
          type="button"
          onClick={handleClick}
        >
          {/* Button Content */}
          <div className="icon-circle">
            <svg viewBox="0 0 320 512" height="1.1em" fill="currentColor">
              <path d="M279.14 288l14.22-92.66h-88.91v-60.13c0-25.35 12.42-50.06 52.24-50.06h40.42V6.26S260.43 0 225.36 0c-73.22 0-121.08 44.38-121.08 124.72v70.62H12.89V288h81.39v224h100.17V288z" />
            </svg>
          </div>
          <span className="button-text">تابعنا على فيسبوك</span>

          {/* Minimalist Herbs - Fixed inside at the bottom */}
          <div className="inner-herb-garden">
            {/* Soft grass base under the herbs */}
            <div className="herb-grass-base" aria-hidden="true" />
            {/* Herb 1 - small mint leaf */}
            <div className="btn-herb">
              <svg viewBox="0 0 40 100">
                <path
                  d="M20 100 Q19 70 20 45"
                  stroke="rgba(232, 245, 233, 0.85)"
                  strokeWidth="3"
                  fill="none"
                />
                <ellipse
                  cx="16"
                  cy="60"
                  rx="6"
                  ry="10"
                  fill="rgba(165, 214, 167, 0.95)"
                  transform="rotate(-18 16 60)"
                />
              </svg>
            </div>
            {/* Herb 2 - layered leaves */}
            <div className="btn-herb">
              <svg viewBox="0 0 40 100">
                <path
                  d="M20 100 Q20 65 21 35"
                  stroke="rgba(232, 245, 233, 0.9)"
                  strokeWidth="3"
                  fill="none"
                />
                <ellipse
                  cx="24"
                  cy="52"
                  rx="7"
                  ry="11"
                  fill="rgba(129, 199, 132, 0.9)"
                  transform="rotate(14 24 52)"
                />
                <ellipse
                  cx="16"
                  cy="40"
                  rx="6"
                  ry="9"
                  fill="rgba(200, 230, 201, 0.95)"
                  transform="rotate(-16 16 40)"
                />
              </svg>
            </div>
            {/* Herb 3 - tall stem */}
            <div className="btn-herb">
              <svg viewBox="0 0 40 100">
                <path
                  d="M20 102 Q20 70 20 20"
                  stroke="rgba(241, 248, 233, 0.95)"
                  strokeWidth="3"
                  fill="none"
                />
                <ellipse
                  cx="12"
                  cy="55"
                  rx="6"
                  ry="11"
                  fill="rgba(174, 213, 129, 0.9)"
                  transform="rotate(-24 12 55)"
                />
                <ellipse
                  cx="28"
                  cy="38"
                  rx="6"
                  ry="10"
                  fill="rgba(129, 199, 132, 0.95)"
                  transform="rotate(22 28 38)"
                />
              </svg>
            </div>
            {/* Herb 4 - center highlight */}
            <div className="btn-herb">
              <svg viewBox="0 0 40 100">
                <path
                  d="M20 102 Q20 65 20 15"
                  stroke="rgba(248, 250, 244, 0.98)"
                  strokeWidth="3.2"
                  fill="none"
                />
                <circle
                  cx="20"
                  cy="44"
                  r="10"
                  fill="rgba(200, 230, 201, 0.98)"
                />
                <circle
                  cx="20"
                  cy="26"
                  r="7"
                  fill="rgba(232, 245, 233, 1)"
                />
              </svg>
            </div>
            {/* Herb 5 - layered side */}
            <div className="btn-herb">
              <svg viewBox="0 0 40 100">
                <path
                  d="M20 100 Q21 72 20 38"
                  stroke="rgba(232, 245, 233, 0.9)"
                  strokeWidth="3"
                  fill="none"
                />
                <ellipse
                  cx="26"
                  cy="58"
                  rx="7"
                  ry="11"
                  fill="rgba(139, 195, 74, 0.9)"
                  transform="rotate(18 26 58)"
                />
                <ellipse
                  cx="14"
                  cy="42"
                  rx="6"
                  ry="9"
                  fill="rgba(220, 237, 200, 0.98)"
                  transform="rotate(-18 14 42)"
                />
              </svg>
            </div>
            {/* Herb 6 - curved leaves */}
            <div className="btn-herb">
              <svg viewBox="0 0 40 100">
                <path
                  d="M20 100 Q22 68 20 42"
                  stroke="rgba(232, 245, 233, 0.9)"
                  strokeWidth="3"
                  fill="none"
                />
                <path
                  d="M20 70 Q33 60 34 48"
                  stroke="rgba(200, 230, 201, 0.95)"
                  strokeWidth="2.4"
                  fill="none"
                />
                <path
                  d="M20 58 Q7 50 6 38"
                  stroke="rgba(200, 230, 201, 0.95)"
                  strokeWidth="2.4"
                  fill="none"
                />
              </svg>
            </div>
            {/* Herb 7 - tiny accent */}
            <div className="btn-herb">
              <svg viewBox="0 0 40 100">
                <path
                  d="M20 100 Q19 76 20 52"
                  stroke="rgba(241, 248, 233, 0.9)"
                  strokeWidth="2.6"
                  fill="none"
                />
                <ellipse
                  cx="18"
                  cy="64"
                  rx="5"
                  ry="8"
                  fill="rgba(174, 213, 129, 0.96)"
                  transform="rotate(-14 18 64)"
                />
              </svg>
            </div>
          </div>
        </button>
      </div>
    </div>
  );
}
