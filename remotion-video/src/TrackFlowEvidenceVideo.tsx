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
  type TrackFlowVideoInput
} from './types';

const brand = {
  bg: '#07111f',
  card: 'rgba(15, 28, 49, 0.86)',
  cardSoft: 'rgba(25, 46, 78, 0.74)',
  line: 'rgba(148, 163, 184, 0.25)',
  text: '#f8fafc',
  muted: '#aab7ca',
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
  // Local file:// paths should be rewritten by scripts/render.mjs before rendering.
  // Returning an empty string here prevents Chrome from trying to load blocked local resources.
  if (/^file:/i.test(text)) return '';
  return staticFile(text.replace(/^\/+/, ''));
};

const getPrimaryVisual = (input: NormalizedTrackFlowVideoInput): string => {
  const roles = [
    'website_overview',
    'website_homepage',
    'homepage',
    'primary_action',
    'secondary_action',
    'action_result',
    'tag_assistant',
    'ga4_debugview_or_gtm_preview'
  ];

  for (const role of roles) {
    const found = input.visuals.find((visual) => visual.role === role);
    const src = safeAssetSrc(found?.src || found?.path);
    if (src) return src;
  }

  const first = input.visuals[0];
  return safeAssetSrc(first?.src || first?.path);
};

const getSecondVisual = (input: NormalizedTrackFlowVideoInput): string => {
  const roles = [
    'primary_action',
    'secondary_action',
    'action_result',
    'tag_assistant',
    'ga4_debugview_or_gtm_preview',
    'google_ads_diagnostics',
    'supporting_visual'
  ];

  for (const role of roles) {
    const found = input.visuals.find((visual) => visual.role === role);
    const src = safeAssetSrc(found?.src || found?.path);
    if (src) return src;
  }

  const second = input.visuals[1] || input.visuals[0];
  return safeAssetSrc(second?.src || second?.path);
};

const statusLabel = (signal?: TrackFlowSignalStatus): string => {
  return signal?.detected
    ? 'Detected during browser-visible review'
    : 'Not clearly detected during browser-side review';
};

const statusColor = (detected?: boolean): string => {
  return detected ? brand.green : brand.amber;
};

const formatIds = (signal?: TrackFlowSignalStatus): string => {
  const ids = signal?.ids || [];
  return ids.length ? ids.join(', ') : 'No browser-visible ID shown';
};

const FadeIn: React.FC<{
  children: React.ReactNode;
  from: number;
  duration?: number;
  y?: number;
}> = ({children, from, duration = 20, y = 18}) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [from, from + duration], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp'
  });

  const translateY = interpolate(frame, [from, from + duration], [y, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp'
  });

  return (
    <div
      style={{
        opacity,
        transform: `translateY(${translateY}px)`
      }}
    >
      {children}
    </div>
  );
};

const SignalRow: React.FC<{
  label: string;
  signal?: TrackFlowSignalStatus;
  delay: number;
}> = ({label, signal, delay}) => {
  const frame = useCurrentFrame();
  const progress = spring({
    frame: Math.max(0, frame - delay),
    fps: 30,
    config: {
      damping: 18,
      stiffness: 120,
      mass: 0.8
    }
  });

  const detected = Boolean(signal?.detected);

  return (
    <div
      style={{
        opacity: progress,
        transform: `translateX(${interpolate(progress, [0, 1], [28, 0])}px)`,
        border: `1px solid ${brand.line}`,
        background: 'rgba(8, 18, 34, 0.74)',
        borderRadius: 16,
        padding: '14px 16px',
        display: 'grid',
        gridTemplateColumns: '36px 1fr',
        columnGap: 12,
        alignItems: 'center'
      }}
    >
      <div
        style={{
          width: 30,
          height: 30,
          borderRadius: 999,
          background: detected ? 'rgba(34, 197, 94, 0.16)' : 'rgba(245, 158, 11, 0.16)',
          border: `1px solid ${detected ? 'rgba(34, 197, 94, 0.55)' : 'rgba(245, 158, 11, 0.55)'}`,
          display: 'grid',
          placeItems: 'center',
          color: statusColor(detected),
          fontSize: 18,
          fontWeight: 900
        }}
      >
        {detected ? '✓' : '!'}
      </div>

      <div>
        <div
          style={{
            color: brand.text,
            fontSize: 20,
            fontWeight: 800,
            letterSpacing: -0.2,
            lineHeight: 1.1
          }}
        >
          {label}
        </div>
        <div
          style={{
            color: statusColor(detected),
            fontSize: 13,
            fontWeight: 700,
            marginTop: 4
          }}
        >
          {statusLabel(signal)}
        </div>
        <div
          style={{
            color: brand.muted,
            fontSize: 12,
            marginTop: 4,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}
        >
          ID: {formatIds(signal)}
        </div>
      </div>
    </div>
  );
};

const WebsiteVisual: React.FC<{
  src: string;
  title: string;
  subtitle: string;
  focusLabel?: string;
}> = ({src, title, subtitle, focusLabel = 'Review in progress'}) => {
  const frame = useCurrentFrame();

  const scrollPhase = frame % 480;
  const scrollY = interpolate(scrollPhase, [0, 70, 330, 480], [0, 0, -28, -28], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp'
  });

  const scanY = interpolate(frame % 150, [0, 150], [-70, 610], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp'
  });

  const pulse = interpolate(Math.sin(frame / 12), [-1, 1], [0.45, 1]);
  const focusTop = interpolate(frame % 360, [0, 120, 240, 360], [32, 32, 58, 58], {
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
          'radial-gradient(circle at 30% 20%, rgba(56, 189, 248, 0.14), transparent 34%), rgba(8, 18, 34, 0.9)',
        boxShadow: '0 28px 90px rgba(0, 0, 0, 0.38)'
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 16,
          borderRadius: 22,
          overflow: 'hidden',
          border: '1px solid rgba(226, 232, 240, 0.18)',
          background: 'rgba(2, 6, 23, 0.72)'
        }}
      >
        <div
          style={{
            height: 34,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '0 14px',
            background: 'rgba(15, 23, 42, 0.92)',
            borderBottom: '1px solid rgba(148, 163, 184, 0.18)'
          }}
        >
          {[brand.red, brand.amber, brand.green].map((color) => (
            <div
              key={color}
              style={{
                width: 10,
                height: 10,
                borderRadius: 999,
                background: color,
                opacity: 0.9
              }}
            />
          ))}
          <div
            style={{
              marginLeft: 8,
              height: 17,
              flex: 1,
              borderRadius: 999,
              background: 'rgba(148, 163, 184, 0.13)',
              color: 'rgba(226, 232, 240, 0.62)',
              fontSize: 10,
              display: 'flex',
              alignItems: 'center',
              paddingLeft: 12,
              fontWeight: 700,
              letterSpacing: 0.3
            }}
          >
            {focusLabel}
          </div>
        </div>

        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: 34,
            bottom: 0,
            overflow: 'hidden',
            background: 'rgba(8, 18, 34, 0.9)'
          }}
        >
          {src ? (
            <>
              <Img
                src={src}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  minHeight: '128%',
                  height: 'auto',
                  transform: `translateY(${scrollY}%) scale(1.015)`,
                  transformOrigin: 'top center',
                  filter: 'saturate(1.08) contrast(1.04)',
                  willChange: 'transform'
                }}
              />

              <div
                style={{
                  position: 'absolute',
                  left: 26,
                  right: 26,
                  top: `${focusTop}%`,
                  height: 92,
                  borderRadius: 18,
                  border: `2px solid rgba(56, 189, 248, ${0.34 + pulse * 0.22})`,
                  boxShadow: `0 0 ${18 + pulse * 16}px rgba(56, 189, 248, 0.22)`,
                  background: 'rgba(56, 189, 248, 0.055)'
                }}
              />

              <div
                style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  top: scanY,
                  height: 92,
                  background:
                    'linear-gradient(180deg, transparent, rgba(56, 189, 248, 0.30), transparent)',
                  mixBlendMode: 'screen',
                  filter: 'blur(1px)'
                }}
              />
            </>
          ) : (
            <div
              style={{
                width: '100%',
                height: '100%',
                display: 'grid',
                placeItems: 'center',
                color: brand.muted,
                fontSize: 26,
                textAlign: 'center',
                padding: 50
              }}
            >
              Website visual review will appear here
            </div>
          )}
        </div>
      </div>

      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(90deg, rgba(7, 17, 31, 0.18), transparent 45%), linear-gradient(0deg, rgba(7, 17, 31, 0.86), transparent 48%)',
          pointerEvents: 'none'
        }}
      />

      <div
        style={{
          position: 'absolute',
          left: 30,
          right: 30,
          bottom: 24
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '7px 11px',
            borderRadius: 999,
            background: 'rgba(56, 189, 248, 0.13)',
            border: '1px solid rgba(56, 189, 248, 0.28)',
            color: brand.blue,
            fontSize: 12,
            fontWeight: 950,
            textTransform: 'uppercase',
            letterSpacing: 1.4,
            marginBottom: 10
          }}
        >
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: 999,
              background: brand.green,
              boxShadow: '0 0 14px rgba(34, 197, 94, 0.65)'
            }}
          />
          Active scan
        </div>
        <div
          style={{
            color: brand.white,
            fontSize: 28,
            fontWeight: 900,
            letterSpacing: -0.4
          }}
        >
          {title}
        </div>
        <div
          style={{
            color: brand.muted,
            fontSize: 15,
            fontWeight: 600,
            marginTop: 8
          }}
        >
          {subtitle}
        </div>
      </div>
    </div>
  );
};

const Header: React.FC<{
  input: NormalizedTrackFlowVideoInput;
  label: string;
}> = ({input, label}) => {
  return (
    <div
      style={{
        position: 'absolute',
        top: 28,
        left: 38,
        right: 38,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        zIndex: 10
      }}
    >
      <div>
        <div
          style={{
            color: brand.blue,
            fontSize: 15,
            fontWeight: 900,
            textTransform: 'uppercase',
            letterSpacing: 2.6
          }}
        >
          TrackFlow Pro
        </div>
        <div
          style={{
            color: brand.text,
            fontSize: 28,
            fontWeight: 950,
            letterSpacing: -0.6,
            marginTop: 4
          }}
        >
          {label}
        </div>
      </div>

      <div
        style={{
          border: `1px solid ${brand.line}`,
          background: 'rgba(8, 18, 34, 0.72)',
          color: brand.muted,
          padding: '10px 14px',
          borderRadius: 999,
          fontSize: 14,
          fontWeight: 700,
          maxWidth: 330,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis'
        }}
      >
        {input.domain}
      </div>
    </div>
  );
};

const ScanBeam: React.FC = () => {
  const frame = useCurrentFrame();
  const y = interpolate(frame % 150, [0, 150], [-60, 620], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp'
  });

  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        top: y,
        height: 82,
        background:
          'linear-gradient(180deg, transparent, rgba(56, 189, 248, 0.25), transparent)',
        filter: 'blur(1px)',
        mixBlendMode: 'screen'
      }}
    />
  );
};

const IntroScene: React.FC<{
  input: NormalizedTrackFlowVideoInput;
  setupFirst: boolean;
}> = ({input, setupFirst}) => {
  const frame = useCurrentFrame();
  const scale = spring({
    frame,
    fps: 30,
    config: {damping: 18, stiffness: 90, mass: 0.9}
  });

  return (
    <AbsoluteFill
      style={{
        background:
          'radial-gradient(circle at 18% 16%, rgba(56, 189, 248, 0.22), transparent 35%), radial-gradient(circle at 80% 20%, rgba(34, 197, 94, 0.16), transparent 34%), #07111f',
        color: brand.text,
        padding: 70,
        justifyContent: 'center'
      }}
    >
      <div
        style={{
          transform: `scale(${interpolate(scale, [0, 1], [0.96, 1])})`,
          maxWidth: 940
        }}
      >
        <FadeIn from={0}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 10,
              padding: '10px 16px',
              borderRadius: 999,
              background: 'rgba(56, 189, 248, 0.12)',
              border: '1px solid rgba(56, 189, 248, 0.35)',
              color: brand.blue,
              fontWeight: 900,
              fontSize: 16,
              letterSpacing: 1.5,
              textTransform: 'uppercase'
            }}
          >
            Private Website Tracking Review
          </div>
        </FadeIn>

        <FadeIn from={12}>
          <div
            style={{
              fontSize: 72,
              lineHeight: 0.98,
              fontWeight: 950,
              letterSpacing: -2.8,
              marginTop: 28
            }}
          >
            {input.businessName}
          </div>
        </FadeIn>

        <FadeIn from={26}>
          <div
            style={{
              fontSize: 26,
              lineHeight: 1.35,
              color: brand.muted,
              marginTop: 24,
              maxWidth: 780,
              fontWeight: 600
            }}
          >
            {setupFirst
              ? 'This review checks whether the website has a clear tracking foundation before event-level testing.'
              : 'This review checks browser-visible tracking signals and the selected business action result.'}
          </div>
        </FadeIn>

        <FadeIn from={42}>
          <div
            style={{
              marginTop: 38,
              display: 'flex',
              gap: 16,
              color: brand.text,
              fontSize: 18,
              fontWeight: 800
            }}
          >
            <div
              style={{
                background: brand.card,
                border: `1px solid ${brand.line}`,
                borderRadius: 18,
                padding: '16px 20px'
              }}
            >
              Website: {input.domain}
            </div>
            <div
              style={{
                background: brand.card,
                border: `1px solid ${brand.line}`,
                borderRadius: 18,
                padding: '16px 20px'
              }}
            >
              Review mode: {setupFirst ? 'Setup readiness' : 'Event verification'}
            </div>
          </div>
        </FadeIn>
      </div>
    </AbsoluteFill>
  );
};

const ScanScene: React.FC<{
  input: NormalizedTrackFlowVideoInput;
  setupFirst: boolean;
}> = ({input, setupFirst}) => {
  const primaryVisual = getPrimaryVisual(input);

  return (
    <AbsoluteFill
      style={{
        background:
          'radial-gradient(circle at 20% 10%, rgba(56, 189, 248, 0.18), transparent 32%), #07111f',
        color: brand.text,
        padding: '96px 38px 34px'
      }}
    >
      <Header
        input={input}
        label={setupFirst ? 'Tracking Foundation Scan' : 'Tracking Signal Scan'}
      />

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1.12fr 0.88fr',
          gap: 28,
          height: '100%',
          marginTop: 8
        }}
      >
        <WebsiteVisual
          src={primaryVisual}
          title={input.businessName}
          subtitle="Website visual review in progress"
          focusLabel="Scanning page structure"
        />

        <div
          style={{
            position: 'relative',
            background: brand.card,
            border: `1px solid ${brand.line}`,
            borderRadius: 28,
            padding: 24,
            overflow: 'hidden',
            boxShadow: '0 28px 90px rgba(0, 0, 0, 0.32)'
          }}
        >
          <ScanBeam />

          <div
            style={{
              position: 'relative',
              zIndex: 2
            }}
          >
            <div
              style={{
                fontSize: 18,
                fontWeight: 900,
                color: brand.blue,
                textTransform: 'uppercase',
                letterSpacing: 1.8,
                marginBottom: 18
              }}
            >
              Browser-visible signals
            </div>

            <div
              style={{
                display: 'grid',
                gap: 13
              }}
            >
              <SignalRow label="GA4" signal={input.trackingSignals.ga4} delay={14} />
              <SignalRow label="Google Tag Manager" signal={input.trackingSignals.gtm} delay={28} />
              <SignalRow label="Google Ads tag" signal={input.trackingSignals.googleAds} delay={42} />
              <SignalRow label="Meta Pixel" signal={input.trackingSignals.metaPixel} delay={56} />
            </div>

            <FadeIn from={86}>
              <div
                style={{
                  marginTop: 22,
                  borderRadius: 18,
                  border: `1px solid ${setupFirst ? 'rgba(245, 158, 11, 0.45)' : 'rgba(56, 189, 248, 0.42)'}`,
                  background: setupFirst
                    ? 'rgba(245, 158, 11, 0.10)'
                    : 'rgba(56, 189, 248, 0.10)',
                  padding: '16px 18px'
                }}
              >
                <div
                  style={{
                    color: setupFirst ? brand.amber : brand.blue,
                    fontSize: 15,
                    fontWeight: 900,
                    textTransform: 'uppercase',
                    letterSpacing: 1.3
                  }}
                >
                  {setupFirst ? 'Setup-first finding' : 'Selected action review'}
                </div>
                <div
                  style={{
                    color: brand.text,
                    fontSize: 22,
                    lineHeight: 1.22,
                    fontWeight: 850,
                    marginTop: 7
                  }}
                >
                  {setupFirst
                    ? 'GA4/GTM tracking foundation was not clearly detected.'
                    : `${input.manualEvidence.actionLabel} was reviewed.`}
                </div>
              </div>
            </FadeIn>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

const EventScene: React.FC<{
  input: NormalizedTrackFlowVideoInput;
}> = ({input}) => {
  const secondVisual = getSecondVisual(input);

  return (
    <AbsoluteFill
      style={{
        background:
          'radial-gradient(circle at 74% 20%, rgba(251, 113, 133, 0.14), transparent 32%), #07111f',
        color: brand.text,
        padding: '96px 38px 34px'
      }}
    >
      <Header input={input} label="Expected vs Observed Result" />

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1.04fr 0.96fr',
          gap: 28,
          height: '100%',
          marginTop: 8
        }}
      >
        <WebsiteVisual
          src={secondVisual}
          title={input.manualEvidence.actionLabel || 'Selected business action'}
          subtitle={`Tool used: ${input.manualEvidence.toolUsed || 'Browser-visible review'}`}
          focusLabel="Checking selected action"
        />

        <div
          style={{
            background: brand.card,
            border: `1px solid ${brand.line}`,
            borderRadius: 28,
            padding: 30,
            boxShadow: '0 28px 90px rgba(0, 0, 0, 0.32)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center'
          }}
        >
          <FadeIn from={0}>
            <div
              style={{
                color: brand.blue,
                fontSize: 17,
                fontWeight: 900,
                textTransform: 'uppercase',
                letterSpacing: 1.7
              }}
            >
              Action reviewed
            </div>
            <div
              style={{
                color: brand.text,
                fontSize: 42,
                lineHeight: 1.04,
                fontWeight: 950,
                letterSpacing: -1.3,
                marginTop: 12
              }}
            >
              {input.manualEvidence.actionLabel}
            </div>
          </FadeIn>

          <FadeIn from={28}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr',
                gap: 14,
                marginTop: 34
              }}
            >
              <div
                style={{
                  borderRadius: 20,
                  border: '1px solid rgba(56, 189, 248, 0.35)',
                  background: 'rgba(56, 189, 248, 0.10)',
                  padding: '18px 20px'
                }}
              >
                <div
                  style={{
                    color: brand.blue,
                    fontSize: 15,
                    fontWeight: 900,
                    textTransform: 'uppercase',
                    letterSpacing: 1.2
                  }}
                >
                  Expected event
                </div>
                <div
                  style={{
                    color: brand.text,
                    fontSize: 28,
                    fontWeight: 900,
                    marginTop: 8
                  }}
                >
                  {input.manualEvidence.expectedEvent || 'Expected event not provided'}
                </div>
              </div>

              <div
                style={{
                  borderRadius: 20,
                  border: '1px solid rgba(245, 158, 11, 0.44)',
                  background: 'rgba(245, 158, 11, 0.11)',
                  padding: '18px 20px'
                }}
              >
                <div
                  style={{
                    color: brand.amber,
                    fontSize: 15,
                    fontWeight: 900,
                    textTransform: 'uppercase',
                    letterSpacing: 1.2
                  }}
                >
                  Observed result
                </div>
                <div
                  style={{
                    color: brand.text,
                    fontSize: 28,
                    fontWeight: 900,
                    marginTop: 8
                  }}
                >
                  {input.manualEvidence.observedEvent || 'Not clearly observed'}
                </div>
              </div>
            </div>
          </FadeIn>

          <FadeIn from={78}>
            <div
              style={{
                marginTop: 26,
                borderRadius: 22,
                background: 'rgba(251, 113, 133, 0.12)',
                border: '1px solid rgba(251, 113, 133, 0.40)',
                padding: '18px 20px'
              }}
            >
              <div
                style={{
                  color: brand.red,
                  fontSize: 15,
                  fontWeight: 950,
                  textTransform: 'uppercase',
                  letterSpacing: 1.4
                }}
              >
                Warning
              </div>
              <div
                style={{
                  color: brand.text,
                  fontSize: 25,
                  lineHeight: 1.22,
                  fontWeight: 850,
                  marginTop: 8
                }}
              >
                The expected event was not clearly observed during the browser-visible review.
              </div>
            </div>
          </FadeIn>
        </div>
      </div>
    </AbsoluteFill>
  );
};

const SetupFirstScene: React.FC<{
  input: NormalizedTrackFlowVideoInput;
}> = ({input}) => {
  const secondVisual = getSecondVisual(input);

  return (
    <AbsoluteFill
      style={{
        background:
          'radial-gradient(circle at 74% 20%, rgba(245, 158, 11, 0.16), transparent 30%), #07111f',
        color: brand.text,
        padding: '96px 38px 34px'
      }}
    >
      <Header input={input} label="Setup Readiness Finding" />

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1.04fr 0.96fr',
          gap: 28,
          height: '100%',
          marginTop: 8
        }}
      >
        <WebsiteVisual
          src={secondVisual}
          title="Tracking foundation review"
          subtitle="Event-level testing should come after setup is confirmed"
          focusLabel="Checking tracking readiness"
        />

        <div
          style={{
            background: brand.card,
            border: `1px solid ${brand.line}`,
            borderRadius: 28,
            padding: 34,
            boxShadow: '0 28px 90px rgba(0, 0, 0, 0.32)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center'
          }}
        >
          <FadeIn from={0}>
            <div
              style={{
                color: brand.amber,
                fontSize: 17,
                fontWeight: 950,
                textTransform: 'uppercase',
                letterSpacing: 1.7
              }}
            >
              Main finding
            </div>
            <div
              style={{
                color: brand.text,
                fontSize: 47,
                lineHeight: 1.02,
                fontWeight: 950,
                letterSpacing: -1.7,
                marginTop: 14
              }}
            >
              GA4/GTM tracking foundation was not clearly detected.
            </div>
          </FadeIn>

          <FadeIn from={44}>
            <div
              style={{
                marginTop: 34,
                display: 'grid',
                gap: 14
              }}
            >
              {[
                'Set up or verify the Google tag / GTM foundation first.',
                'Install and confirm GA4 page activity.',
                'Then configure and test the selected business action.'
              ].map((item, index) => (
                <div
                  key={item}
                  style={{
                    display: 'flex',
                    gap: 12,
                    alignItems: 'flex-start',
                    background: brand.cardSoft,
                    border: `1px solid ${brand.line}`,
                    borderRadius: 18,
                    padding: '15px 17px',
                    fontSize: 22,
                    lineHeight: 1.22,
                    fontWeight: 800
                  }}
                >
                  <span
                    style={{
                      color: index === 0 ? brand.amber : brand.green,
                      fontWeight: 950
                    }}
                  >
                    {index + 1}.
                  </span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </FadeIn>

          <FadeIn from={96}>
            <div
              style={{
                marginTop: 28,
                color: brand.muted,
                fontSize: 18,
                lineHeight: 1.35,
                fontWeight: 650
              }}
            >
              Future test target: {input.manualEvidence.actionLabel || 'selected business action'}
            </div>
          </FadeIn>
        </div>
      </div>
    </AbsoluteFill>
  );
};

const RecommendationScene: React.FC<{
  input: NormalizedTrackFlowVideoInput;
  setupFirst: boolean;
}> = ({input, setupFirst}) => {
  return (
    <AbsoluteFill
      style={{
        background:
          'radial-gradient(circle at 20% 18%, rgba(34, 197, 94, 0.17), transparent 32%), radial-gradient(circle at 82% 18%, rgba(56, 189, 248, 0.16), transparent 35%), #07111f',
        color: brand.text,
        padding: 76,
        justifyContent: 'center'
      }}
    >
      <FadeIn from={0}>
        <div
          style={{
            color: brand.blue,
            fontSize: 17,
            fontWeight: 950,
            textTransform: 'uppercase',
            letterSpacing: 2.2
          }}
        >
          Recommended next step
        </div>
      </FadeIn>

      <FadeIn from={18}>
        <div
          style={{
            fontSize: 62,
            lineHeight: 1.02,
            fontWeight: 950,
            letterSpacing: -2.2,
            marginTop: 16,
            maxWidth: 1060
          }}
        >
          {setupFirst
            ? 'Verify the tracking foundation before judging individual events.'
            : 'Confirm the expected event inside GA4, GTM, Google Ads, and backend records.'}
        </div>
      </FadeIn>

      <FadeIn from={52}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 18,
            marginTop: 38
          }}
        >
          {(setupFirst
            ? ['Google tag / GTM setup', 'GA4 page activity', 'Controlled event test after setup']
            : ['GA4 DebugView', 'GTM Preview', 'Google Ads / CRM records']
          ).map((item) => (
            <div
              key={item}
              style={{
                background: brand.card,
                border: `1px solid ${brand.line}`,
                borderRadius: 22,
                padding: 22,
                minHeight: 110
              }}
            >
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 999,
                  background: 'rgba(34, 197, 94, 0.15)',
                  border: '1px solid rgba(34, 197, 94, 0.48)',
                  color: brand.green,
                  display: 'grid',
                  placeItems: 'center',
                  fontWeight: 950,
                  marginBottom: 14
                }}
              >
                ✓
              </div>
              <div
                style={{
                  fontSize: 22,
                  lineHeight: 1.18,
                  fontWeight: 850
                }}
              >
                {item}
              </div>
            </div>
          ))}
        </div>
      </FadeIn>

      <FadeIn from={96}>
        <div
          style={{
            marginTop: 36,
            color: brand.muted,
            fontSize: 19,
            lineHeight: 1.35,
            maxWidth: 980,
            fontWeight: 620
          }}
        >
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
    frame < 210
      ? 'intro'
      : frame < 690
        ? 'scan'
        : frame < 1170
          ? setupFirst
            ? 'setup'
            : 'event'
          : 'recommendation';

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
      {scene === 'setup' && <SetupFirstScene input={input} />}
      {scene === 'event' && <EventScene input={input} />}
      {scene === 'recommendation' && (
        <RecommendationScene input={input} setupFirst={setupFirst} />
      )}

      <div
        style={{
          position: 'absolute',
          left: 38,
          right: 38,
          bottom: 18,
          height: 4,
          borderRadius: 999,
          background: 'rgba(148, 163, 184, 0.18)',
          overflow: 'hidden'
        }}
      >
        <div
          style={{
            width: `${progress}%`,
            height: '100%',
            background: `linear-gradient(90deg, ${brand.blue}, ${brand.green})`,
            borderRadius: 999
          }}
        />
      </div>
    </AbsoluteFill>
  );
};