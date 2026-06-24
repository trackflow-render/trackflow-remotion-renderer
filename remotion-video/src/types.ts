export type TrackFlowReportMode =
  | 'tracking_foundation_setup'
  | 'ga4_setup_needed'
  | 'ga4_event_verification'
  | 'event_positive_snapshot'
  | 'ads_conversion_verification'
  | 'ecommerce_measurement_readiness'
  | 'limited_evidence_review'
  | 'tracking_verification_snapshot'
  | string;

export type TrackFlowTrackingCase = {
  mode?: TrackFlowReportMode;
  label?: string;
  reason?: string;
};

export type TrackFlowSignalStatus = {
  detected?: boolean;
  ids?: string[];
  label?: string;
  note?: string;
};

export type TrackFlowTrackingSignals = {
  ga4?: TrackFlowSignalStatus;
  gtm?: TrackFlowSignalStatus;
  googleAds?: TrackFlowSignalStatus & {
    conversionRequestDetected?: boolean;
  };
  metaPixel?: TrackFlowSignalStatus;
};

export type TrackFlowManualEvidence = {
  businessName?: string;
  actionLabel?: string;
  expectedEvent?: string;
  observedEvent?: string;
  actionCompleted?: boolean | string;
  toolUsed?: string;
  ga4EventObserved?: string;
  googleAdsConversionObserved?: string;
  gtmTriggerObserved?: string;
  testUrl?: string;
  operatorNote?: string;
};

export type TrackFlowVisualAsset = {
  role:
    | 'website_homepage'
    | 'homepage'
    | 'primary_action'
    | 'action_result'
    | 'tag_assistant'
    | 'ga4_debugview_or_gtm_preview'
    | 'google_ads_diagnostics'
    | 'supporting_visual'
    | string;
  src?: string;
  path?: string;
  caption?: string;
};

export type TrackFlowVideoInput = {
  schemaVersion?: string;
  jobId?: string;
  businessName?: string;
  domain?: string;
  websiteUrl?: string;

  reportMode?: TrackFlowReportMode;
  report_mode?: TrackFlowReportMode;

  trackingCase?: TrackFlowTrackingCase;
  tracking_case?: TrackFlowTrackingCase;

  trackingSignals?: TrackFlowTrackingSignals;
  tracking_signals?: TrackFlowTrackingSignals;

  manualEvidence?: TrackFlowManualEvidence;
  manual_evidence?: TrackFlowManualEvidence;

  visuals?: TrackFlowVisualAsset[];
  screenshots?: TrackFlowVisualAsset[];

  clientSafeDisclaimer?: string;
  client_safe_disclaimer?: string;
};

export type NormalizedTrackFlowVideoInput = {
  schemaVersion: string;
  jobId: string;
  businessName: string;
  domain: string;
  websiteUrl: string;
  reportMode: TrackFlowReportMode;
  trackingCase: TrackFlowTrackingCase;
  trackingSignals: {
    ga4: TrackFlowSignalStatus;
    gtm: TrackFlowSignalStatus;
    googleAds: TrackFlowSignalStatus & {
      conversionRequestDetected?: boolean;
    };
    metaPixel: TrackFlowSignalStatus;
  };
  manualEvidence: TrackFlowManualEvidence;
  visuals: TrackFlowVisualAsset[];
  clientSafeDisclaimer: string;
};

export const SETUP_FIRST_MODES = new Set<string>([
  'tracking_foundation_setup',
  'ga4_setup_needed'
]);

export const EVENT_VERIFICATION_MODES = new Set<string>([
  'ga4_event_verification',
  'event_positive_snapshot',
  'ads_conversion_verification',
  'ecommerce_measurement_readiness'
]);

export const normalizeText = (
  value: unknown,
  fallback = '',
  maxLength = 180
): string => {
  const text = String(value ?? '')
    .replace(/[\u0000-\u001f\u007f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (!text) return fallback;
  return text.length > maxLength ? `${text.slice(0, maxLength - 3).trim()}...` : text;
};

export const normalizeIdList = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];

  return Array.from(
    new Set(
      value
        .map((item) => normalizeText(item, '', 80))
        .filter(Boolean)
    )
  ).slice(0, 4);
};

export const isSetupFirstMode = (mode: unknown): boolean => {
  return SETUP_FIRST_MODES.has(String(mode || '').trim());
};

export const isEventVerificationMode = (mode: unknown): boolean => {
  return EVENT_VERIFICATION_MODES.has(String(mode || '').trim());
};

export const getReportMode = (input: TrackFlowVideoInput): TrackFlowReportMode => {
  return (
    input.trackingCase?.mode ||
    input.tracking_case?.mode ||
    input.reportMode ||
    input.report_mode ||
    'tracking_verification_snapshot'
  );
};

export const normalizeTrackingSignal = (
  signal: TrackFlowSignalStatus | undefined,
  fallbackLabel: string
): TrackFlowSignalStatus => {
  return {
    detected: Boolean(signal?.detected),
    ids: normalizeIdList(signal?.ids),
    label: normalizeText(signal?.label, fallbackLabel, 80),
    note: normalizeText(signal?.note, '', 140)
  };
};

export const normalizeVideoInput = (
  input: TrackFlowVideoInput
): NormalizedTrackFlowVideoInput => {
  const reportMode = getReportMode(input);
  const manualEvidence = input.manualEvidence || input.manual_evidence || {};
  const visuals = input.visuals || input.screenshots || [];

  const businessName =
    normalizeText(input.businessName, '', 120) ||
    normalizeText(manualEvidence.businessName, 'Selected Business', 120);

  const domain = normalizeText(input.domain, 'website', 120);
  const trackingSignalsSource = input.trackingSignals || input.tracking_signals || {};

  return {
    schemaVersion: normalizeText(input.schemaVersion, 'trackflow-video-input-v1', 80),
    jobId: normalizeText(input.jobId, 'demo-job', 100),
    businessName,
    domain,
    websiteUrl: normalizeText(input.websiteUrl, '', 180),
    reportMode,
    trackingCase: input.trackingCase || input.tracking_case || {mode: reportMode},
    trackingSignals: {
      ga4: normalizeTrackingSignal(trackingSignalsSource.ga4, 'GA4'),
      gtm: normalizeTrackingSignal(trackingSignalsSource.gtm, 'Google Tag Manager'),
      googleAds: {
        ...normalizeTrackingSignal(trackingSignalsSource.googleAds, 'Google Ads tag'),
        conversionRequestDetected: Boolean(
          trackingSignalsSource.googleAds?.conversionRequestDetected
        )
      },
      metaPixel: normalizeTrackingSignal(trackingSignalsSource.metaPixel, 'Meta Pixel')
    },
    manualEvidence: {
      businessName,
      actionLabel: normalizeText(manualEvidence.actionLabel, 'Selected business action', 120),
      expectedEvent: normalizeText(manualEvidence.expectedEvent, '', 120),
      observedEvent: normalizeText(manualEvidence.observedEvent, '', 140),
      actionCompleted: manualEvidence.actionCompleted ?? '',
      toolUsed: normalizeText(manualEvidence.toolUsed, 'Tag Assistant', 80),
      ga4EventObserved: normalizeText(manualEvidence.ga4EventObserved, '', 80),
      googleAdsConversionObserved: normalizeText(
        manualEvidence.googleAdsConversionObserved,
        '',
        80
      ),
      gtmTriggerObserved: normalizeText(manualEvidence.gtmTriggerObserved, '', 80),
      testUrl: normalizeText(manualEvidence.testUrl, '', 180),
      operatorNote: normalizeText(manualEvidence.operatorNote, '', 220)
    },
    visuals: visuals
      .map((visual) => ({
        ...visual,
        src: normalizeText(visual.src || visual.path, '', 300),
        path: normalizeText(visual.path || visual.src, '', 300),
        caption: normalizeText(visual.caption, '', 120)
      }))
      .filter((visual) => Boolean(visual.src || visual.path))
      .slice(0, 5),
    clientSafeDisclaimer: normalizeText(
      input.clientSafeDisclaimer || input.client_safe_disclaimer,
      'Browser-visible review and operator-provided evidence only. Final account-side confirmation is still recommended.',
      220
    )
  };
};
