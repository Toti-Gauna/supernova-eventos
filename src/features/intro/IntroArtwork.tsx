import { useId } from 'react';

const STARS = Array.from({ length: 46 }, (_, index) => ({
  x: (index * 37 + 11) % 101,
  y: (index * 53 + 7) % 101,
  size: index % 9 === 0 ? 2 : 1,
  opacity: .12 + (index % 5) * .065,
}));

/** A solar first frame for HTML, Suspense and fallback; never a second Canvas. */
export default function IntroArtwork() {
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, '');

  return <>
    <div className="intro-static-sky" aria-hidden="true">
      <div className="intro-backdrop" />
      <div className="intro-stars">
        {STARS.map((star, index) => <i key={index} style={{ left: `${star.x}%`, top: `${star.y}%`, width: star.size, height: star.size, opacity: star.opacity }} />)}
      </div>
    </div>
    <div className="intro-composition" data-intro="composition" aria-hidden="true">
      <div className="intro-orbital-system">
        <svg className="intro-orbital-map" viewBox="0 0 480 380" fill="none">
          <defs>
            <radialGradient id={`${id}-radiance`}><stop stopColor="#f2d4a3" stopOpacity=".2" /><stop offset=".28" stopColor="#d2a373" stopOpacity=".055" /><stop offset="1" stopColor="#d2a373" stopOpacity="0" /></radialGradient>
            <radialGradient id={`${id}-sun`} cx=".36" cy=".32" r=".8"><stop stopColor="#fff2d7" /><stop offset=".46" stopColor="#e4c399" /><stop offset="1" stopColor="#9f7552" /></radialGradient>
            <linearGradient id={`${id}-orbit`} x1="50" y1="300" x2="440" y2="70" gradientUnits="userSpaceOnUse"><stop stopColor="#ae96c9" stopOpacity=".07" /><stop offset=".5" stopColor="#d6c8e7" stopOpacity=".48" /><stop offset="1" stopColor="#ae96c9" stopOpacity=".08" /></linearGradient>
            <radialGradient id={`${id}-earth`} cx=".27" cy=".23" r=".8"><stop stopColor="#abd9ef" /><stop offset=".3" stopColor="#367fa8" /><stop offset=".72" stopColor="#142b40" /><stop offset="1" stopColor="#05090d" /></radialGradient>
            <radialGradient id={`${id}-jupiter`} cx=".27" cy=".23" r=".8"><stop stopColor="#e0cdb8" /><stop offset=".3" stopColor="#c6a584" /><stop offset=".72" stopColor="#554330" /><stop offset="1" stopColor="#0c0906" /></radialGradient>
            <radialGradient id={`${id}-saturn`} cx=".27" cy=".23" r=".8"><stop stopColor="#e4d6b5" /><stop offset=".3" stopColor="#d5bd89" /><stop offset=".7" stopColor="#584832" /><stop offset="1" stopColor="#0c0906" /></radialGradient>
            <radialGradient id={`${id}-mercury`} cx=".27" cy=".23" r=".8"><stop stopColor="#c8c3b8" /><stop offset=".3" stopColor="#a6a29a" /><stop offset=".72" stopColor="#3c3b39" /><stop offset="1" stopColor="#0a0908" /></radialGradient>
            <radialGradient id={`${id}-venus`} cx=".27" cy=".23" r=".8"><stop stopColor="#ead4ae" /><stop offset=".3" stopColor="#dfb578" /><stop offset=".72" stopColor="#5b3f27" /><stop offset="1" stopColor="#0e0906" /></radialGradient>
            <radialGradient id={`${id}-mars`} cx=".27" cy=".23" r=".8"><stop stopColor="#e0a887" /><stop offset=".3" stopColor="#c87145" /><stop offset=".72" stopColor="#4b2418" /><stop offset="1" stopColor="#110805" /></radialGradient>
            <radialGradient id={`${id}-uranus`} cx=".27" cy=".23" r=".8"><stop stopColor="#b6e3df" /><stop offset=".3" stopColor="#92d0d1" /><stop offset=".72" stopColor="#2c484c" /><stop offset="1" stopColor="#080f11" /></radialGradient>
            <radialGradient id={`${id}-neptune`} cx=".27" cy=".23" r=".8"><stop stopColor="#99c7ef" /><stop offset=".3" stopColor="#346bbd" /><stop offset=".72" stopColor="#152d50" /><stop offset="1" stopColor="#050a11" /></radialGradient>
            <radialGradient id={`${id}-pearl`} cx=".27" cy=".23" r=".8"><stop stopColor="#ece6de" /><stop offset=".35" stopColor="#a49bad" /><stop offset=".8" stopColor="#3a3441" /><stop offset="1" stopColor="#0a090d" /></radialGradient>
            <radialGradient id={`${id}-night`} cx=".27" cy=".23" r=".92"><stop offset=".24" stopColor="#020305" stopOpacity="0" /><stop offset=".65" stopColor="#020305" stopOpacity=".2" /><stop offset="1" stopColor="#020305" stopOpacity=".78" /></radialGradient>
            <clipPath id={`${id}-earth-clip`}><circle cx="300" cy="157" r="14" /></clipPath>
            <clipPath id={`${id}-jupiter-clip`}><circle cx="149" cy="218" r="12" /></clipPath>
            <clipPath id={`${id}-saturn-clip`}><circle cx="405" cy="168" r="9.5" /></clipPath>
          </defs>
          <circle data-intro="radiance" cx="240" cy="185" r="92" fill={`url(#${id}-radiance)`} />
          <g data-intro="orbits" stroke={`url(#${id}-orbit)`} strokeWidth=".65">
            <ellipse cx="240" cy="185" rx="59" ry="24" transform="rotate(-15 240 185)" />
            <ellipse cx="240" cy="185" rx="107" ry="46" transform="rotate(-15 240 185)" />
            <ellipse cx="240" cy="185" rx="166" ry="73" transform="rotate(-15 240 185)" />
            <ellipse cx="240" cy="185" rx="217" ry="96" transform="rotate(-15 240 185)" />
            <path d="M51 316H118M379 70H432" stroke="#d1b6ed" strokeOpacity=".23" />
            <circle cx="50" cy="316" r="1.6" fill="#d1b6ed" stroke="none" />
            <circle cx="432" cy="70" r="1.6" fill="#8daca5" stroke="none" />
          </g>
          <g data-intro="point" data-intro-point="0" data-solar-body="earth">
            <circle cx="300" cy="157" r="14.8" stroke="#abd9ef" strokeWidth=".55" strokeOpacity=".35" />
            <circle cx="300" cy="157" r="14" fill={`url(#${id}-earth)`} />
            <g clipPath={`url(#${id}-earth-clip)`}>
              <path d="M289 149L294 146 297 147 299 150 297 153 294 152 292 154 289 152ZM296 157L300 158 302 162 300 168 297 165 296 161ZM306 149L310 150 313 153 309 155 308 158 304 157 302 154 304 151ZM310 162L313 163 314 165 311 167 308 165Z" fill="#91a780" />
              <path d="M288 154Q294 151 300 153T313 153M292 163Q299 160 307 162M297 145Q302 143 307 146" stroke="#f1f3ee" strokeWidth=".85" strokeLinecap="round" strokeOpacity=".62" />
              <circle cx="300" cy="157" r="14" fill={`url(#${id}-night)`} />
            </g>
            <circle cx="300" cy="157" r="14" stroke="#abd9ef" strokeWidth=".35" strokeOpacity=".65" />
          </g>
          <g data-intro="point" data-intro-point="1" data-solar-body="jupiter">
            <circle cx="149" cy="218" r="12" fill={`url(#${id}-jupiter)`} />
            <g clipPath={`url(#${id}-jupiter-clip)`}>
              <path d="M136 212Q149 216 162 212M136 219Q149 222 163 219M137 225Q149 227 161 224" stroke="#80593f" strokeWidth="2.3" strokeOpacity=".65" />
              <path d="M136 216Q149 219 163 216M138 223Q149 225 161 222" stroke="#e5cfaa" strokeWidth="1.15" strokeOpacity=".65" />
              <ellipse cx="154" cy="221" rx="2.7" ry="1.35" transform="rotate(-9 154 221)" fill="#ae6043" />
              <circle cx="149" cy="218" r="12" fill={`url(#${id}-night)`} />
            </g>
            <circle cx="149" cy="218" r="12" stroke="#e0cdb8" strokeWidth=".3" strokeOpacity=".7" />
            <circle data-solar-moon cx="129" cy="209" r="2.5" fill={`url(#${id}-pearl)`} />
            <circle data-solar-moon cx="164" cy="201" r="3" fill={`url(#${id}-pearl)`} />
            <circle data-solar-moon cx="169" cy="225" r="1.9" fill={`url(#${id}-pearl)`} />
            <circle data-solar-moon cx="137" cy="237" r="2.2" fill={`url(#${id}-pearl)`} />
          </g>
          <g data-intro="point" data-intro-point="2" data-solar-body="saturn">
            <ellipse cx="405" cy="168" rx="18" ry="4.5" transform="rotate(-19 405 168)" stroke="#e4d6b5" strokeWidth="1.5" strokeOpacity=".58" />
            <ellipse cx="405" cy="168" rx="15.5" ry="3.8" transform="rotate(-19 405 168)" stroke="#a19174" strokeWidth=".5" strokeOpacity=".55" />
            <circle cx="405" cy="168" r="9.5" fill={`url(#${id}-saturn)`} />
            <g clipPath={`url(#${id}-saturn-clip)`}>
              <path d="M394 165Q405 168 416 165M396 171Q405 173 415 170" stroke="#a88e63" strokeWidth="1" strokeOpacity=".55" />
              <circle cx="405" cy="168" r="9.5" fill={`url(#${id}-night)`} />
            </g>
            <circle cx="405" cy="168" r="9.5" stroke="#e4d6b5" strokeWidth=".3" strokeOpacity=".7" />
            <path d="M388 175Q405 179 422 162" stroke="#e4d6b5" strokeWidth="1.3" strokeOpacity=".7" />
          </g>
          <g data-intro="point" data-intro-point="3" data-solar-body="mercury">
            <circle cx="202" cy="111" r="4.8" fill={`url(#${id}-mercury)`} stroke="#c8c3b8" strokeWidth=".25" />
            <circle cx="200" cy="110" r="1.1" fill="#373533" fillOpacity=".28" />
            <circle cx="203.3" cy="112.5" r=".7" fill="#292827" fillOpacity=".25" />
          </g>
          <g data-intro="point" data-intro-point="4" data-solar-body="venus">
            <circle cx="270" cy="236" r="5.5" fill={`url(#${id}-venus)`} stroke="#ead4ae" strokeWidth=".25" />
            <path d="M266 234Q269 232 274 235M267 238Q270 236 273 239" stroke="#ead4ae" strokeWidth=".65" strokeOpacity=".4" />
          </g>
          <g data-intro="point" data-intro-point="5" data-solar-body="mars">
            <circle cx="201" cy="242" r="5.8" fill={`url(#${id}-mars)`} stroke="#e0a887" strokeWidth=".25" />
            <path d="M198 237.7Q201 236.2 204 238" stroke="#ebd8c9" strokeWidth=".9" strokeOpacity=".55" />
            <path d="M198 242L202 241 204 243 201 246Z" fill="#5b2d21" fillOpacity=".5" />
          </g>
          <g data-intro="point" data-intro-point="6" data-solar-body="uranus">
            <ellipse cx="73" cy="254" rx="11" ry="2.8" transform="rotate(62 73 254)" stroke="#b6e3df" strokeWidth=".5" strokeOpacity=".48" />
            <circle cx="73" cy="254" r="6.5" fill={`url(#${id}-uranus)`} stroke="#b6e3df" strokeWidth=".25" />
            <path d="M75 244Q82 253 76 264" stroke="#b6e3df" strokeWidth=".55" strokeOpacity=".6" />
          </g>
          <g data-intro="point" data-intro-point="7" data-solar-body="neptune">
            <circle cx="407" cy="110" r="7" fill={`url(#${id}-neptune)`} stroke="#99c7ef" strokeWidth=".25" />
            <path d="M402 108Q407 106 412 108M403 113Q408 110 411 113" stroke="#b4d6ef" strokeWidth=".65" strokeOpacity=".45" />
          </g>
          <g className="intro-solar-ship" transform="translate(133 125) rotate(-14)"><path d="M-14 0L-4-6 9-3 18 0 9 3-4 6Z" fill="#807b8b" /><path d="M-3-3L8-1 11 0 8 1-3 3Z" fill="#171922" /><path d="M-11-3L-6-2M-11 3L-6 2" stroke="#c1b5da" strokeWidth="1" /><circle cx="26" cy="0" r="1.5" fill="#bba7d8" /></g>
          <circle cx="240" cy="185" r="10.5" fill={`url(#${id}-sun)`} />
          <circle cx="240" cy="185" r="12" stroke="#eed7b3" strokeWidth=".35" strokeOpacity=".25" />
        </svg>
        <span className="intro-orbital-label">TU PRÓXIMA ÓRBITA</span>
      </div>
      <div className="intro-brand-lockup" data-intro="identity">
        <div className="intro-identity">
          <div className="intro-wordmark-mask"><div className="intro-wordmark" data-intro="wordmark"><svg className="intro-brand-symbol" viewBox="0 0 40 40" fill="none"><path d="M20 3c0 12-5 17-17 17 12 0 17 5 17 17 0-12 5-17 17-17C25 20 20 15 20 3Z" fill="currentColor" /><circle cx="20" cy="20" r="17" stroke="currentColor" strokeWidth=".6" opacity=".55" /></svg><span>supernova</span></div></div>
          <div className="intro-tagline" data-intro="tagline">conectá sin límites</div>
        </div>
        <div className="intro-caption" data-intro="caption"><span />UN UNIVERSO DE EXPERIENCIAS<span /></div>
      </div>
    </div>
  </>;
}
