import React from 'react';
import {
  AbsoluteFill,
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig
} from 'remotion';
import {
  isSetupFirstMode,
  normalizeText,
  normalizeVideoInput,
  type NormalizedTrackFlowVideoInput,
  type TrackFlowSignalStatus,
  type TrackFlowVideoInput,
  type TrackFlowVisualAsset
} from './types';

const brand = {
  bg: '#06111f',
  panel: 'rgba(9, 18, 33, 0.88)',
  panelSoft: 'rgba(15, 28, 50, 0.78)',
  line: 'rgba(148, 163, 184, 0.24)',
  text: '#f8fafc',
  muted: '#a8b4c7',
  blue: '#38bdf8',
  green: '#22c55e',
  amber: '#f59e0b',
  red: '#fb7185',
  white: '#ffffff'
};

const safeAssetSrc = (value: unknown): string => {
  const text = normalizeText(value, '', 500);
  if (!text) return '';
  if (/^(?:https?:\/\/|data:image\/|blob:)/i.test(text)) return text;
  if (/^file:/i.test(text)) return '';
  return staticFile(text.replace(/^\/+/, ''));
};

const getVisual = (
  input: NormalizedTrackFlowVideoInput,
  roles: string[],
  fallbackIndex = 0
): TrackFlowVisualAsset | undefined => {
  for (const role of roles) {
    const found = input.visuals.find((visual) => visual.role === role);
    if (safeAssetSrc(found?.src || found?.path || found?.url)) return found;
  }
  return input.visuals[fallbackIndex] || input.visuals[0];
};

const getVisualSrc = (visual?: TrackFlowVisualAsset): string =>
  safeAssetSrc(visual?.src || visual?.path || visual?.url);

const hasSignalEvidence = (signal?: TrackFlowSignalStatus): boolean =>
  Boolean(
    signal?.detected ||
      (signal?.ids || []).length > 0 ||
      signal?.conversionRequestDetected ||
      signal?.conversion_request_detected
  );

const signalColor = (signal?: TrackFlowSignalStatus): string =>
  hasSignalEvidence(signal) ? brand.green : brand.amber;

const signalStatus = (signal?: TrackFlowSignalStatus): string => {
  return hasSignalEvidence(signal)
    ? 'Detected during browser-visible review'
    : 'Not clearly detected during browser-side review';
};

const formatIds = (signal?: TrackFlowSignalStatus): string => {
  const ids = signal?.ids || [];
  if (ids.length) return ids.join(', ');
  if (signal?.conversionRequestDetected || signal?.conversion_request_detected) return 'Conversion request observed';
  return 'No browser-visible ID shown';
};

const hasGoogleAdsEvidence = (input: NormalizedTrackFlowVideoInput): boolean =>
  hasSignalEvidence(input.trackingSignals.googleAds);

const eventNameForCopy = (input: NormalizedTrackFlowVideoInput): string =>
  input.manualEvidence.expectedEvent || 'the expected event';

const formatStatus = (value: unknown, positiveText = 'Observed'): string => {
  const text = normalizeText(value, '', 60).toLowerCase();
  if (!text) return 'Not clearly observed';
  if (['yes', 'true', 'observed', 'event_observed', 'ok'].includes(text)) return positiveText;
  if (['no', 'false', 'not_observed', 'no_clear_event_observed', 'not clearly observed'].includes(text)) {
    return 'Not clearly observed';
  }
  if (text === 'not_sure') return 'Needs verification';
  if (text === 'not_tested') return 'Not tested';
  return normalizeText(value, 'Needs verification', 70);
};

const FadeIn: React.FC<{children: React.ReactNode; from: number; duration?: number; y?: number}> = ({
  children,
  from,
  duration = 16,
  y = 14
}) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [from, from + duration], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp'
  });
  const translateY = interpolate(frame, [from, from + duration], [y, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp'
  });

  return <div style={{opacity, transform: `translateY(${translateY}px)`}}>{children}</div>;
};

const SignalCard: React.FC<{
  label: string;
  signal?: TrackFlowSignalStatus;
  delay: number;
  sceneStart?: number;
}> = ({label, signal, delay, sceneStart = 80}) => {
  const frame = useCurrentFrame();
  const localFrame = frame - sceneStart;
  const cardFrame = Math.max(0, localFrame - delay);
  const progress = spring({
    frame: cardFrame,
    fps: 30,
    config: {damping: 13, stiffness: 170, mass: 0.62}
  });
  const detected = Boolean(signal?.detected);
  const color = signalColor(signal);
  const scanning = localFrame >= delay && localFrame < delay + 18;
  const iconReady = localFrame >= delay + 14;
  const pulse = interpolate(cardFrame % 46, [0, 7, 18, 46], [0, 1, 0.35, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp'
  });
  const scanSweepX = interpolate(cardFrame % 62, [0, 62], [-70, 360], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp'
  });
  const scale = interpolate(progress, [0, 0.55, 1], [0.92, 1.035, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp'
  });
  const dotOne = interpolate(cardFrame % 36, [0, 9, 18, 36], [0.25, 1, 0.25, 0.25], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp'
  });
  const dotTwo = interpolate((cardFrame + 12) % 36, [0, 9, 18, 36], [0.25, 1, 0.25, 0.25], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp'
  });
  const dotThree = interpolate((cardFrame + 24) % 36, [0, 9, 18, 36], [0.25, 1, 0.25, 0.25], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp'
  });

  return (
    <div
      style={{
        position: 'relative',
        opacity: progress,
        transform: `translateX(${interpolate(progress, [0, 1], [38, 0])}px) scale(${scale})`,
        border: `1px solid ${detected ? 'rgba(34,197,94,.42)' : 'rgba(245,158,11,.42)'}`,
        background: detected ? 'rgba(34,197,94,.095)' : 'rgba(245,158,11,.095)',
        borderRadius: 16,
        padding: '12px 14px',
        display: 'grid',
        gridTemplateColumns: '30px 1fr',
        gap: 10,
        alignItems: 'center',
        boxShadow: `0 0 ${10 + pulse * 24}px ${detected ? 'rgba(34,197,94,.22)' : 'rgba(245,158,11,.18)'}`,
        overflow: 'hidden',
        willChange: 'transform, opacity'
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: scanSweepX,
          width: 72,
          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,.18), transparent)',
          transform: 'skewX(-18deg)',
          opacity: localFrame >= delay ? 0.9 : 0,
          pointerEvents: 'none'
        }}
      />
      <div
        style={{
          position: 'relative',
          width: 28,
          height: 28,
          borderRadius: 999,
          display: 'grid',
          placeItems: 'center',
          color,
          border: `1px solid ${color}`,
          fontSize: 17,
          fontWeight: 950,
          background: 'rgba(2,6,23,.36)',
          boxShadow: `0 0 ${12 + pulse * 16}px ${detected ? 'rgba(34,197,94,.36)' : 'rgba(245,158,11,.30)'}`
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: -7,
            borderRadius: 999,
            border: `1px solid ${color}`,
            opacity: pulse * 0.55,
            transform: `scale(${1 + pulse * 0.38})`
          }}
        />
        {iconReady ? (detected ? '✓' : '!') : '•'}
      </div>
      <div style={{minWidth: 0, position: 'relative', zIndex: 2}}>
        <div style={{fontSize: 17, fontWeight: 900, color: brand.text, lineHeight: 1.05}}>{label}</div>
        <div style={{fontSize: 12, fontWeight: 750, color, marginTop: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>
          {scanning ? (
            <span>
              Scanning signal
              <span style={{opacity: dotOne}}>.</span>
              <span style={{opacity: dotTwo}}>.</span>
              <span style={{opacity: dotThree}}>.</span>
            </span>
          ) : (
            signalStatus(signal)
          )}
        </div>
        <div style={{fontSize: 11, color: brand.muted, marginTop: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>
          {iconReady ? formatIds(signal) : 'Reading browser-visible tag data'}
        </div>
      </div>
    </div>
  );
};

const MiniMetric: React.FC<{label: string; value: string; tone?: 'blue' | 'amber' | 'red' | 'green'}> = ({
  label,
  value,
  tone = 'blue'
}) => {
  const color = tone === 'red' ? brand.red : tone === 'amber' ? brand.amber : tone === 'green' ? brand.green : brand.blue;

  return (
    <div
      style={{
        border: `1px solid ${color}55`,
        background: `${color}18`,
        borderRadius: 18,
        padding: '14px 16px'
      }}
    >
      <div style={{fontSize: 12, color, fontWeight: 950, textTransform: 'uppercase', letterSpacing: 1.2}}>
        {label}
      </div>
      <div style={{fontSize: 23, color: brand.text, fontWeight: 930, lineHeight: 1.12, marginTop: 6}}>
        {value}
      </div>
    </div>
  );
};

const ScanCursor: React.FC<{active?: boolean}> = ({active = true}) => {
  const frame = useCurrentFrame();
  const x = interpolate(frame % 120, [0, 55, 120], [60, 62, 78], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp'
  });
  const y = interpolate(frame % 120, [0, 55, 120], [70, 72, 62], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp'
  });
  const opacity = active ? 1 : 0;

  return (
    <div
      style={{
        position: 'absolute',
        left: `${x}%`,
        top: `${y}%`,
        opacity,
        transform: 'translate(-50%, -50%)',
        zIndex: 5
      }}
    >
      <div
        style={{
          width: 50,
          height: 50,
          borderRadius: 999,
          border: '2px solid rgba(56,189,248,.74)',
          boxShadow: '0 0 22px rgba(56,189,248,.45)',
          background: 'rgba(56,189,248,.08)'
        }}
      />
    </div>
  );
};

const WebsiteScanVisual: React.FC<{
  src: string;
  title: string;
  subtitle: string;
  mode: 'homepage' | 'action';
  showClick?: boolean;
  sceneStart?: number;
}> = ({src, title, subtitle, mode, showClick = false, sceneStart}) => {
  const frame = useCurrentFrame();
  const localFrame = Math.max(0, frame - (sceneStart ?? (mode === 'homepage' ? 80 : 355)));

  const scrollY = mode === 'homepage'
    ? interpolate(localFrame, [0, 52, 232, 275], [0, 0, -40, -40], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp'
      })
    : interpolate(localFrame, [0, 60, 150, 238], [0, 0, -24, 0], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp'
      });

  const scrollProgress = mode === 'homepage'
    ? interpolate(localFrame, [0, 52, 232, 275], [0.03, 0.03, 0.78, 0.78], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp'
      })
    : interpolate(localFrame, [0, 60, 150, 238], [0.1, 0.1, 0.48, 0.1], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp'
      });

  const scanY = mode === 'homepage'
    ? interpolate(localFrame, [0, 250], [-70, 610], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp'
      })
    : interpolate(localFrame, [0, 190], [-70, 560], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp'
      });

  const scanOpacity = mode === 'homepage'
    ? interpolate(localFrame, [0, 28, 210, 250], [0, 0.9, 0.9, 0], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp'
      })
    : interpolate(localFrame, [0, 36, 135, 190], [0, 0.25, 0.25, 0], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp'
      });

  const focusY = mode === 'homepage'
    ? interpolate(localFrame, [0, 105, 220], [34, 54, 68], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp'
      })
    : interpolate(localFrame, [0, 115, 238], [54, 66, 56], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp'
      });

  return (
    <div
      style={{
        position: 'relative',
        height: '100%',
        borderRadius: 28,
        overflow: 'hidden',
        border: `1px solid ${brand.line}`,
        background:
          'radial-gradient(circle at 30% 20%, rgba(56,189,248,.16), transparent 36%), rgba(8,18,34,.95)',
        boxShadow: '0 28px 90px rgba(0,0,0,.38)'
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 15,
          borderRadius: 22,
          overflow: 'hidden',
          border: '1px solid rgba(226,232,240,.20)',
          background: 'rgba(2,6,23,.86)'
        }}
      >
        <div
          style={{
            height: 34,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '0 14px',
            background: 'rgba(15,23,42,.95)',
            borderBottom: '1px solid rgba(148,163,184,.2)'
          }}
        >
          {[brand.red, brand.amber, brand.green].map((color) => (
            <div key={color} style={{width: 10, height: 10, borderRadius: 999, background: color}} />
          ))}
          <div
            style={{
              marginLeft: 8,
              height: 17,
              flex: 1,
              borderRadius: 999,
              background: 'rgba(148,163,184,.14)',
              color: 'rgba(226,232,240,.62)',
              fontSize: 10,
              display: 'flex',
              alignItems: 'center',
              paddingLeft: 12,
              fontWeight: 700,
              letterSpacing: 0.3
            }}
          >
            {mode === 'homepage' ? 'Reviewing page structure' : 'Opening selected action path'}
          </div>
        </div>

        <div style={{position: 'absolute', left: 0, right: 0, top: 34, bottom: 0, overflow: 'hidden'}}>
          {src ? (
            <>
              <Img
                src={src}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  minHeight: '150%',
                  height: 'auto',
                  transform: `translateY(${scrollY}%) scale(1.018)`,
                  transformOrigin: 'top center',
                  filter: 'saturate(1.08) contrast(1.04)',
                  willChange: 'transform'
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  left: 24,
                  right: 24,
                  top: `${focusY}%`,
                  height: mode === 'homepage' ? 78 : 96,
                  borderRadius: 18,
                  border: `2px solid ${mode === 'homepage' ? 'rgba(56,189,248,.58)' : 'rgba(56,189,248,.34)'}`,
                  boxShadow: mode === 'homepage' ? '0 0 25px rgba(56,189,248,.25)' : '0 0 18px rgba(56,189,248,.14)',
                  background: mode === 'homepage' ? 'rgba(56,189,248,.055)' : 'rgba(56,189,248,.035)'
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  top: scanY,
                  height: 88,
                  opacity: scanOpacity,
                  background: 'linear-gradient(180deg, transparent, rgba(56,189,248,.34), transparent)',
                  mixBlendMode: 'screen',
                  filter: 'blur(1px)'
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  top: 48,
                  right: 10,
                  bottom: 12,
                  width: 7,
                  borderRadius: 999,
                  background: 'rgba(15,23,42,.58)',
                  border: '1px solid rgba(226,232,240,.14)',
                  boxShadow: '0 0 16px rgba(0,0,0,.24)'
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    left: 1,
                    right: 1,
                    height: '25%',
                    top: `${5 + scrollProgress * 68}%`,
                    borderRadius: 999,
                    background: 'linear-gradient(180deg, rgba(56,189,248,.95), rgba(34,197,94,.85))',
                    boxShadow: '0 0 16px rgba(56,189,248,.48)'
                  }}
                />
              </div>
              {showClick && <ScanCursor />}
            </>
          ) : (
            <div
              style={{
                width: '100%',
                height: '100%',
                display: 'grid',
                placeItems: 'center',
                color: brand.muted,
                fontSize: 24,
                textAlign: 'center',
                padding: 48
              }}
            >
              Website visual review
            </div>
          )}
        </div>
      </div>

      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(90deg, rgba(7,17,31,.14), transparent 45%), linear-gradient(0deg, rgba(7,17,31,.88), transparent 48%)',
          pointerEvents: 'none'
        }}
      />

      <div style={{position: 'absolute', left: 30, right: 30, bottom: 23}}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '7px 11px',
            borderRadius: 999,
            background: 'rgba(56,189,248,.13)',
            border: '1px solid rgba(56,189,248,.30)',
            color: brand.blue,
            fontSize: 12,
            fontWeight: 950,
            textTransform: 'uppercase',
            letterSpacing: 1.4,
            marginBottom: 10
          }}
        >
          <span style={{width: 8, height: 8, borderRadius: 999, background: brand.green, boxShadow: '0 0 14px rgba(34,197,94,.65)'}} />
          {mode === 'homepage' ? 'Page scan' : 'Action path'}
        </div>
        <div style={{color: brand.white, fontSize: 27, fontWeight: 930, letterSpacing: -0.4}}>
          {title}
        </div>
        <div style={{color: brand.muted, fontSize: 15, fontWeight: 650, marginTop: 7}}>
          {subtitle}
        </div>
      </div>
    </div>
  );
};

const Header: React.FC<{input: NormalizedTrackFlowVideoInput; label: string}> = ({input, label}) => (
  <div style={{position: 'absolute', top: 24, left: 34, right: 34, display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 20}}>
    <div>
      <div style={{color: brand.blue, fontSize: 14, fontWeight: 950, textTransform: 'uppercase', letterSpacing: 2.4}}>
        TrackFlow Pro
      </div>
      <div style={{color: brand.text, fontSize: 27, fontWeight: 950, letterSpacing: -0.6, marginTop: 3}}>
        {label}
      </div>
    </div>
    <div style={{border: `1px solid ${brand.line}`, background: 'rgba(8,18,34,.72)', color: brand.muted, padding: '9px 14px', borderRadius: 999, fontSize: 14, fontWeight: 750, maxWidth: 330, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>
      {input.domain}
    </div>
  </div>
);

const IntroScene: React.FC<{input: NormalizedTrackFlowVideoInput; setupFirst: boolean}> = ({input, setupFirst}) => {
  const frame = useCurrentFrame();
  const entrance = spring({frame, fps: 30, config: {damping: 18, stiffness: 90, mass: 0.9}});

  return (
    <AbsoluteFill
      style={{
        background:
          'radial-gradient(circle at 18% 16%, rgba(56,189,248,.22), transparent 35%), radial-gradient(circle at 82% 18%, rgba(34,197,94,.14), transparent 34%), #06111f',
        color: brand.text,
        padding: 64,
        justifyContent: 'center'
      }}
    >
      <div style={{transform: `scale(${interpolate(entrance, [0, 1], [0.965, 1])})`, maxWidth: 960}}>
        <FadeIn from={0}>
          <div style={{display: 'inline-flex', padding: '9px 15px', borderRadius: 999, background: 'rgba(56,189,248,.12)', border: '1px solid rgba(56,189,248,.35)', color: brand.blue, fontWeight: 950, fontSize: 15, letterSpacing: 1.5, textTransform: 'uppercase'}}>
            {setupFirst ? 'Tracking setup readiness' : 'Tracking & action verification'}
          </div>
        </FadeIn>
        <FadeIn from={10}>
          <div style={{fontSize: 66, lineHeight: 0.98, fontWeight: 950, letterSpacing: -2.5, marginTop: 24}}>
            {input.businessName}
          </div>
        </FadeIn>
        <FadeIn from={22}>
          <div style={{fontSize: 23, lineHeight: 1.35, color: brand.muted, marginTop: 22, maxWidth: 820, fontWeight: 650}}>
            {setupFirst
              ? 'Quick browser-visible scan of the tracking foundation before event-level testing.'
              : `Quick scan of ${input.manualEvidence.actionLabel} and the expected event signal.`}
          </div>
        </FadeIn>
      </div>
    </AbsoluteFill>
  );
};

const ScanScene: React.FC<{input: NormalizedTrackFlowVideoInput; setupFirst: boolean}> = ({input, setupFirst}) => {
  const homepage = getVisual(input, ['website_overview', 'website_homepage', 'homepage'], 0);
  const src = getVisualSrc(homepage);

  return (
    <AbsoluteFill style={{background: '#06111f', color: brand.text, padding: '86px 34px 30px'}}>
      <Header input={input} label={setupFirst ? 'Foundation Scan' : 'Signal Scan'} />
      <div style={{display: 'grid', gridTemplateColumns: '1.08fr .92fr', gap: 24, height: '100%'}}>
        <WebsiteScanVisual
          src={src}
          title={input.businessName}
          subtitle="Website structure and tag signals"
          mode="homepage"
          sceneStart={80}
        />

        <div style={{position: 'relative', background: brand.panel, border: `1px solid ${brand.line}`, borderRadius: 28, padding: 22, overflow: 'hidden', boxShadow: '0 28px 90px rgba(0,0,0,.32)'}}>
          <div style={{position: 'absolute', inset: 0, background: 'radial-gradient(circle at 20% 0%, rgba(56,189,248,.15), transparent 40%)'}} />
          <div style={{position: 'relative', zIndex: 2}}>
            <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14}}>
              <div style={{fontSize: 15, color: brand.blue, fontWeight: 950, textTransform: 'uppercase', letterSpacing: 1.8}}>
                Detected signals
              </div>
              <div style={{display: 'inline-flex', alignItems: 'center', gap: 6, color: brand.muted, fontSize: 11, fontWeight: 800, letterSpacing: .8, textTransform: 'uppercase'}}>
                <span style={{width: 7, height: 7, borderRadius: 999, background: brand.green, boxShadow: '0 0 12px rgba(34,197,94,.75)'}} />
                scanning
              </div>
            </div>
            <div style={{display: 'grid', gap: 10}}>
              <SignalCard label="GA4" signal={input.trackingSignals.ga4} delay={18} sceneStart={80} />
              <SignalCard label="GTM" signal={input.trackingSignals.gtm} delay={48} sceneStart={80} />
              <SignalCard label="Google Ads" signal={input.trackingSignals.googleAds} delay={78} sceneStart={80} />
              <SignalCard label="Meta Pixel" signal={input.trackingSignals.metaPixel} delay={108} sceneStart={80} />
            </div>
            <FadeIn from={74}>
              <div style={{marginTop: 16}}>
                <MiniMetric
                  label={setupFirst ? 'Current finding' : 'Action focus'}
                  value={setupFirst ? 'GA4 tracking foundation needs verification' : input.manualEvidence.actionLabel}
                  tone={setupFirst ? 'amber' : 'blue'}
                />
              </div>
            </FadeIn>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

const EventScene: React.FC<{input: NormalizedTrackFlowVideoInput; setupFirst: boolean}> = ({input, setupFirst}) => {
  const actionVisual = getVisual(input, ['primary_action', 'secondary_action', 'action_result', 'tag_assistant', 'ga4_debugview_or_gtm_preview'], 1);
  const src = getVisualSrc(actionVisual);
  const googleAdsPresent = hasGoogleAdsEvidence(input);
  const confirmationText = googleAdsPresent
    ? 'Expected event needs GA4, GTM and Google Ads account confirmation'
    : 'Expected event needs GA4, GTM and backend confirmation';

  return (
    <AbsoluteFill style={{background: '#06111f', color: brand.text, padding: '86px 34px 30px'}}>
      <Header input={input} label={setupFirst ? 'Setup-first Finding' : 'Expected vs Observed'} />
      <div style={{display: 'grid', gridTemplateColumns: '1.08fr .92fr', gap: 24, height: '100%'}}>
        <WebsiteScanVisual
          src={src}
          title={setupFirst ? 'Future event test path' : input.manualEvidence.actionLabel}
          subtitle={setupFirst ? 'Event testing comes after setup is confirmed' : `Tool: ${input.manualEvidence.toolUsed || 'Tag Assistant'}`}
          mode="action"
          showClick={!setupFirst}
          sceneStart={355}
        />

        <div style={{background: brand.panel, border: `1px solid ${brand.line}`, borderRadius: 28, padding: 28, boxShadow: '0 28px 90px rgba(0,0,0,.32)', display: 'flex', flexDirection: 'column', justifyContent: 'center'}}>
          {setupFirst ? (
            <>
              <FadeIn from={0}>
                <div style={{color: brand.amber, fontSize: 15, fontWeight: 950, textTransform: 'uppercase', letterSpacing: 1.6}}>Main issue</div>
                <div style={{color: brand.text, fontSize: 42, lineHeight: 1.04, fontWeight: 950, letterSpacing: -1.5, marginTop: 10}}>
                  GA4 tracking foundation needs verification.
                </div>
              </FadeIn>
              <div style={{display: 'grid', gap: 12, marginTop: 26}}>
                <FadeIn from={24}><MiniMetric label="Step 1" value="Confirm GTM / Google tag path" tone="amber" /></FadeIn>
                <FadeIn from={44}><MiniMetric label="Step 2" value="Install or verify GA4 page_view activity" tone="blue" /></FadeIn>
                <FadeIn from={64}><MiniMetric label="Future test target" value={input.manualEvidence.futureTestTarget || input.manualEvidence.actionLabel} tone="green" /></FadeIn>
              </div>
            </>
          ) : (
            <>
              <FadeIn from={0}>
                <div style={{color: brand.blue, fontSize: 15, fontWeight: 950, textTransform: 'uppercase', letterSpacing: 1.6}}>Selected action</div>
                <div style={{color: brand.text, fontSize: 38, lineHeight: 1.04, fontWeight: 950, letterSpacing: -1.3, marginTop: 10}}>
                  {input.manualEvidence.actionLabel}
                </div>
              </FadeIn>
              <div style={{display: 'grid', gap: 12, marginTop: 24}}>
                <FadeIn from={24}><MiniMetric label="Expected event" value={input.manualEvidence.expectedEvent || 'Expected event not provided'} tone="blue" /></FadeIn>
                <FadeIn from={44}><MiniMetric label="Observed result" value={input.manualEvidence.observedEvent || formatStatus(input.manualEvidence.ga4EventObserved)} tone="amber" /></FadeIn>
                <FadeIn from={64}><MiniMetric label="Event confirmation" value={confirmationText} tone="red" /></FadeIn>
              </div>
            </>
          )}
        </div>
      </div>
    </AbsoluteFill>
  );
};

const FinalScene: React.FC<{input: NormalizedTrackFlowVideoInput; setupFirst: boolean}> = ({input, setupFirst}) => {
  const googleAdsPresent = hasGoogleAdsEvidence(input);
  const expectedEvent = eventNameForCopy(input);
  const finalHeadline = setupFirst
    ? 'Verify the tracking foundation first, then test the selected business action.'
    : googleAdsPresent
      ? `Confirm ${expectedEvent} inside GA4, GTM, Google Ads, and backend records.`
      : `Confirm ${expectedEvent} inside GA4, GTM, and backend records.`;
  const steps = setupFirst
    ? ['GTM / Google tag', 'GA4 page activity', 'Controlled event test']
    : googleAdsPresent
      ? ['GA4 DebugView', 'GTM Preview', 'Google Ads / CRM']
      : ['GA4 DebugView', 'GTM Preview', 'CRM / backend records'];

  return (
    <AbsoluteFill
      style={{
        background:
          'radial-gradient(circle at 18% 18%, rgba(56,189,248,.18), transparent 34%), radial-gradient(circle at 82% 18%, rgba(34,197,94,.14), transparent 36%), #06111f',
        color: brand.text,
        padding: 68,
        justifyContent: 'center'
      }}
    >
      <FadeIn from={0}>
        <div style={{color: brand.blue, fontSize: 15, fontWeight: 950, textTransform: 'uppercase', letterSpacing: 2}}>
          Recommended next step
        </div>
      </FadeIn>
      <FadeIn from={14}>
        <div style={{fontSize: 52, lineHeight: 1.03, fontWeight: 950, letterSpacing: -1.8, marginTop: 16, maxWidth: 1040}}>
          {finalHeadline}
        </div>
      </FadeIn>
      <FadeIn from={42}>
        <div style={{marginTop: 30, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16}}>
          {steps.map((item) => (
            <div key={item} style={{background: brand.panelSoft, border: `1px solid ${brand.line}`, borderRadius: 20, padding: 20, minHeight: 94}}>
              <div style={{width: 30, height: 30, borderRadius: 999, display: 'grid', placeItems: 'center', border: '1px solid rgba(34,197,94,.48)', color: brand.green, fontWeight: 950}}>✓</div>
              <div style={{fontSize: 21, lineHeight: 1.18, fontWeight: 850, marginTop: 12}}>{item}</div>
            </div>
          ))}
        </div>
      </FadeIn>
      <FadeIn from={64}>
        <div style={{marginTop: 28, color: brand.muted, fontSize: 17, maxWidth: 960, lineHeight: 1.35}}>
          {input.clientSafeDisclaimer}
        </div>
      </FadeIn>
    </AbsoluteFill>
  );
};

export const TrackFlowEvidenceVideo: React.FC<TrackFlowVideoInput> = (props) => {
  const input = normalizeVideoInput(props);
  const frame = useCurrentFrame();
  const {durationInFrames} = useVideoConfig();
  const setupFirst = isSetupFirstMode(input.reportMode);

  const scene =
    frame < 80
      ? 'intro'
      : frame < 355
        ? 'scan'
        : frame < 610
          ? 'event'
          : 'final';

  const progress = interpolate(frame, [0, durationInFrames - 1], [0, 100], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp'
  });

  return (
    <AbsoluteFill
      style={{
        background: brand.bg,
        fontFamily:
          'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
      }}
    >
      {scene === 'intro' && <IntroScene input={input} setupFirst={setupFirst} />}
      {scene === 'scan' && <ScanScene input={input} setupFirst={setupFirst} />}
      {scene === 'event' && <EventScene input={input} setupFirst={setupFirst} />}
      {scene === 'final' && <FinalScene input={input} setupFirst={setupFirst} />}

      <div style={{position: 'absolute', left: 36, right: 36, bottom: 17, height: 4, borderRadius: 999, background: 'rgba(148,163,184,.18)', overflow: 'hidden'}}>
        <div style={{width: `${progress}%`, height: '100%', background: `linear-gradient(90deg, ${brand.blue}, ${brand.green})`, borderRadius: 999}} />
      </div>
    </AbsoluteFill>
  );
};
