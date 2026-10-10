import { useState } from 'react';
import { thumb } from '../lib/data.js';

/**
 * YouTube thumbnail with a graceful fallback. Some networks and embedded
 * browsers block i.ytimg.com; when that happens we keep the tile (and the
 * layout) and just show a placeholder rather than an empty box.
 */
export default function Thumb({ videoId, duration, className = '' }) {
  const [failed, setFailed] = useState(false);

  return (
    <span className={`thumb ${className}`}>
      {!failed && (
        <img
          src={thumb(videoId)}
          alt=""
          loading="lazy"
          onError={() => setFailed(true)}
        />
      )}
      {failed && (
        <span className="thumb-fallback" aria-hidden="true">
          ▶
        </span>
      )}
      {duration && <span className="dur">{duration}</span>}
    </span>
  );
}
