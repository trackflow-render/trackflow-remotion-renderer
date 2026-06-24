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
  statusText?: string;
  status_text?: string;
  conversionRequestDetected?: boolean;
  conversion_request_detected?: boolean;
};

export type TrackFlowTrackingSignals = {
  ga4?: TrackFlowSignalStatus;
  gtm?: TrackFlowSignalStatus;
  googleAds?: TrackFlowSignalStatus;
  google_ads?: TrackFlowSignalStatus;
  metaPixel?: TrackFlowSignalStatus;
  meta_pixel?: TrackFlowSignalStatus;
};

export type TrackFlowManualEvidence = {
  businessName?: string;
  actionLabel?: string;
  action_label?: string;
  expectedEvent?: string;
  expected_event?: string;
  observedEvent?: string;
  observed_event?: string;
  observedEventName?: string;
  observed_event_name?: string;
  eventName?: string;
  event_name?: string;
  actionCompleted?: boolean | string;
  action_completed?: boolean | string;
  toolUsed?: string;
  tool_used?: string;
  tool?: string;
  ga4EventObserved?: string;
  ga4_event_observed?: string;
  googleAdsConversionObserved?: string;
  google_ads_conversion_observed?: string;
  gtmTriggerObserved?: string;
  gtm_trigger_observed?: string;
  testUrl?: string;
  test_url?: string;
  operatorNote?: string;
  operator_note?: string;
  evidenceNote?: string;
  evidence_note?: string;
  note?: string;
  notes?: string;
};

export type TrackFlowVisualAsset = {
  role:
    | 'website_overview'
    | 'website_homepage'
    | 'homepage'
    | 'primary_action'
    | 'secondary_action'
    | 'action_result'
    | 'tag_assistant'
    | 'ga4_debugview_or_gtm_preview'
    | 'google_ads_diagnostics'
    | 'supporting_visual'
    | string;
  src?: string;
  path?: string;
  caption?: string;
  mimeType?: string;
  mime_type?: string;
  sizeBytes?: number;
  size_bytes?: number;
  pageUrl?: string;
  page_url?: string;
};

export type TrackFlowVideoInput = {
  schemaVersion?: string;
  packageVersion?: string;
  jobId?: string;
  businessName?: string;
  domain?: string;
  websiteUrl?: string;
  website_url?: string;

  reportMode?: TrackFlowReportMode;
  report_mode?: TrackFlowReportMode;

  trackingCase?: TrackFlowTrackingCase;
  tracking_case?: TrackFlowTrackingCase;

  trackingSignals?: TrackFlowTrackingSignals;
  tracking_signals?: TrackFlowTrackingSignals;

  manualEvidence?: TrackFlowManualEvidence;
  manual_evidence?: TrackFlowManualEvidence;
  selectedAction?: TrackFlowManualEvidence;
  selected_action?: TrackFlowManualEvidence;

  visuals?: TrackFlowVisualAsset[];
  screenshots?: TrackFlowVisualAsset[];
  visualAssets?: TrackFlowVisualAsset[];
  visual_assets?: TrackFlowVisualAsset[];

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
    googleAds: TrackFlowSignalStatus;
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
    new Set(value.map((item) => normalizeText(item, '', 80)).filter(Boolean))
  ).slice(0, 4);
};

export const isSetupFirstMode = (mode: unknown): boolean => SETUP_FIRST_MODES.has(String(mode || '').trim());
export const isEventVerificationMode = (mode: unknown): boolean => EVENT_VERIFICATION_MODES.has(String(mode || '').trim());

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
    detected: Boolean(signal?.detected || normalizeIdList(signal?.ids).length),
    ids: normalizeIdList(signal?.ids),
    label: normalizeText(signal?.label, fallbackLabel, 80),
    note: normalizeText(signal?.note || signal?.statusText || signal?.status_text, '', 140),
    conversionRequestDetected: Boolean(signal?.conversionRequestDetected || signal?.conversion_request_detected)
  };
};

const getVisuals = (input: TrackFlowVideoInput): TrackFlowVisualAsset[] =>
  input.visuals || input.screenshots || input.visualAssets || input.visual_assets || [];

const getManualEvidence = (input: TrackFlowVideoInput): TrackFlowManualEvidence =>
  input.manualEvidence || input.manual_evidence || input.selectedAction || input.selected_action || {};

export const normalizeVideoInput = (
  input: TrackFlowVideoInput
): NormalizedTrackFlowVideoInput => {
  const reportMode = getReportMode(input);
  const manualEvidence = getManualEvidence(input);
  const visuals = getVisuals(input);
  const signals = input.trackingSignals || input.tracking_signals || {};

  const businessName =
    normalizeText(input.businessName, '', 120) ||
    normalizeText(manualEvidence.businessName, 'Selected Business', 120);

  const domain = normalizeText(input.domain, 'website', 120);
  const googleAdsSignal = signals.googleAds || signals.google_ads;
  const metaPixelSignal = signals.metaPixel || signals.meta_pixel;

  return {
    schemaVersion: normalizeText(input.schemaVersion, 'trackflow-video-input-v1', 80),
    jobId: normalizeText(input.jobId, 'demo-job', 100),
    businessName,
    domain,
    websiteUrl: normalizeText(input.websiteUrl || input.website_url, '', 180),
    reportMode,
    trackingCase: input.trackingCase || input.tracking_case || {mode: reportMode},
    trackingSignals: {
      ga4: normalizeTrackingSignal(signals.ga4, 'GA4'),
      gtm: normalizeTrackingSignal(signals.gtm, 'Google Tag Manager'),
      googleAds: normalizeTrackingSignal(googleAdsSignal, 'Google Ads tag'),
      metaPixel: normalizeTrackingSignal(metaPixelSignal, 'Meta Pixel')
    },
    manualEvidence: {
      businessName,
      actionLabel: normalizeText(manualEvidence.actionLabel || manualEvidence.action_label, 'Selected business action', 120),
      expectedEvent: normalizeText(manualEvidence.expectedEvent || manualEvidence.expected_event, '', 120),
      observedEvent: normalizeText(
        manualEvidence.observedEvent ||
          manualEvidence.observed_event ||
          manualEvidence.observedEventName ||
          manualEvidence.observed_event_name ||
          manualEvidence.eventName ||
          manualEvidence.event_name,
        '',
        140
      ),
      actionCompleted: manualEvidence.actionCompleted || manualEvidence.action_completed || '',
      toolUsed: normalizeText(manualEvidence.toolUsed || manualEvidence.tool_used || manualEvidence.tool || 'Tag Assistant', 80),
      ga4EventObserved: normalizeText(manualEvidence.ga4EventObserved || manualEvidence.ga4_event_observed, '', 80),
      googleAdsConversionObserved: normalizeText(manualEvidence.googleAdsConversionObserved || manualEvidence.google_ads_conversion_observed, '', 80),
      gtmTriggerObserved: normalizeText(manualEvidence.gtmTriggerObserved || manualEvidence.gtm_trigger_observed, '', 80),
      testUrl: normalizeText(manualEvidence.testUrl || manualEvidence.test_url, '', 180),
      operatorNote: normalizeText(
        manualEvidence.operatorNote ||
          manualEvidence.operator_note ||
          manualEvidence.evidenceNote ||
          manualEvidence.evidence_note ||
          manualEvidence.note ||
          manualEvidence.notes,
        '',
        220
      )
    },
    visuals: visuals
      .map((visual) => ({
        ...visual,
        src: normalizeText(visual.src || visual.path, '', 500),
        path: normalizeText(visual.path || visual.src, '', 500),
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
