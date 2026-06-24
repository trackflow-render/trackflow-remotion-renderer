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

export type TrackFlowSignalCard = {
  key?: string;
  label?: string;
  detected?: boolean;
  ids?: string[];
  statusText?: string;
  status_text?: string;
};

export type TrackFlowTrackingSignals = {
  ga4?: TrackFlowSignalStatus;
  gtm?: TrackFlowSignalStatus;
  googleAds?: TrackFlowSignalStatus;
  google_ads?: TrackFlowSignalStatus;
  metaPixel?: TrackFlowSignalStatus;
  meta_pixel?: TrackFlowSignalStatus;

  // Flat shape emitted by TrackFlow package builder.
  ga4Detected?: boolean;
  ga4_detected?: boolean;
  ga4Ids?: string[];
  ga4_ids?: string[];
  gtmDetected?: boolean;
  gtm_detected?: boolean;
  gtmIds?: string[];
  gtm_ids?: string[];
  googleAdsDetected?: boolean;
  google_ads_detected?: boolean;
  googleAdsIds?: string[];
  google_ads_ids?: string[];
  googleAdsConversionRequestDetected?: boolean;
  google_ads_conversion_request_detected?: boolean;
  metaPixelDetected?: boolean;
  meta_pixel_detected?: boolean;
  metaPixelIds?: string[];
  meta_pixel_ids?: string[];
  cards?: TrackFlowSignalCard[];
};

export type TrackFlowManualEvidence = {
  businessName?: string;
  actionLabel?: string;
  action_label?: string;
  futureTestTarget?: string;
  future_test_target?: string;
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
  displayMode?: string;
  display_mode?: string;
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
  url?: string;
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
  schema_version?: string;
  packageVersion?: string;
  package_version?: string;
  jobId?: string;
  job_id?: string;
  businessName?: string;
  business_name?: string;
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
  manualEvidence: {
    businessName: string;
    actionLabel: string;
    futureTestTarget: string;
    expectedEvent: string;
    observedEvent: string;
    actionCompleted: boolean | string;
    toolUsed: string;
    ga4EventObserved: string;
    googleAdsConversionObserved: string;
    gtmTriggerObserved: string;
    testUrl: string;
    operatorNote: string;
  };
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
  return text.length > maxLength ? `${text.slice(0, Math.max(0, maxLength - 3)).trim()}...` : text;
};

export const normalizeIdList = (...values: unknown[]): string[] => {
  const output: string[] = [];
  const seen = new Set<string>();

  const visit = (value: unknown) => {
    if (Array.isArray(value)) {
      value.forEach(visit);
      return;
    }

    const text = normalizeText(value, '', 80);
    if (!text || seen.has(text)) return;
    seen.add(text);
    output.push(text);
  };

  values.forEach(visit);
  return output.slice(0, 4);
};

export const isSetupFirstMode = (mode: unknown): boolean =>
  SETUP_FIRST_MODES.has(String(mode || '').trim());

export const isEventVerificationMode = (mode: unknown): boolean =>
  EVENT_VERIFICATION_MODES.has(String(mode || '').trim());

export const getReportMode = (input: TrackFlowVideoInput): TrackFlowReportMode => {
  return (
    input.trackingCase?.mode ||
    input.tracking_case?.mode ||
    input.reportMode ||
    input.report_mode ||
    'tracking_verification_snapshot'
  );
};

const getSignalCard = (
  signals: TrackFlowTrackingSignals,
  key: 'ga4' | 'gtm' | 'google_ads' | 'meta_pixel'
): TrackFlowSignalCard | undefined => {
  const cards = Array.isArray(signals.cards) ? signals.cards : [];
  return cards.find((card) => String(card?.key || '').toLowerCase() === key);
};

const normalizeBool = (...values: unknown[]): boolean => {
  return values.some((value) => {
    if (typeof value === 'boolean') return value;
    const text = normalizeText(value, '', 40).toLowerCase();
    return ['true', 'yes', 'found', 'detected', 'observed', 'tag found'].includes(text);
  });
};

export const normalizeTrackingSignal = (
  nestedSignal: TrackFlowSignalStatus | undefined,
  flatDetected: unknown,
  flatIds: unknown,
  card: TrackFlowSignalCard | undefined,
  fallbackLabel: string,
  extra?: Partial<TrackFlowSignalStatus>
): TrackFlowSignalStatus => {
  const ids = normalizeIdList(nestedSignal?.ids, flatIds, card?.ids);
  const detected = Boolean(
    normalizeBool(nestedSignal?.detected, flatDetected, card?.detected) ||
      ids.length ||
      extra?.conversionRequestDetected
  );

  return {
    detected,
    ids,
    label: normalizeText(nestedSignal?.label || card?.label, fallbackLabel, 80),
    note: normalizeText(
      nestedSignal?.note ||
        nestedSignal?.statusText ||
        nestedSignal?.status_text ||
        card?.statusText ||
        card?.status_text,
      '',
      140
    ),
    conversionRequestDetected: Boolean(
      nestedSignal?.conversionRequestDetected ||
        nestedSignal?.conversion_request_detected ||
        extra?.conversionRequestDetected
    )
  };
};

const getVisuals = (input: TrackFlowVideoInput): TrackFlowVisualAsset[] => {
  const arrays = [input.visuals, input.visualAssets, input.visual_assets, input.screenshots].filter(Array.isArray) as TrackFlowVisualAsset[][];
  const output: TrackFlowVisualAsset[] = [];
  const seen = new Set<string>();

  for (const array of arrays) {
    for (const visual of array) {
      const src = normalizeText(visual?.src || visual?.path || visual?.url, '', 500);
      const role = normalizeText(visual?.role, 'supporting_visual', 80);
      const key = `${role}|${src}`;
      if (!src || seen.has(key)) continue;
      seen.add(key);
      output.push({
        ...visual,
        role,
        src,
        path: normalizeText(visual.path || visual.src || visual.url, src, 500),
        caption: normalizeText(visual.caption, '', 120)
      });
    }
  }

  return output.slice(0, 6);
};

const getManualEvidence = (input: TrackFlowVideoInput): TrackFlowManualEvidence => ({
  ...(input.manual_evidence || {}),
  ...(input.manualEvidence || {}),
  ...(input.selected_action || {}),
  ...(input.selectedAction || {})
});

const readManualText = (
  evidence: TrackFlowManualEvidence,
  camelKey: keyof TrackFlowManualEvidence,
  snakeKey?: keyof TrackFlowManualEvidence,
  fallback = '',
  limit = 140
): string => {
  return normalizeText(evidence[camelKey] || (snakeKey ? evidence[snakeKey] : ''), fallback, limit);
};

export const normalizeVideoInput = (
  input: TrackFlowVideoInput
): NormalizedTrackFlowVideoInput => {
  const reportMode = getReportMode(input);
  const manualEvidence = getManualEvidence(input);
  const visuals = getVisuals(input);
  const signals = input.trackingSignals || input.tracking_signals || {};

  const businessName =
    normalizeText(input.businessName || input.business_name, '', 120) ||
    normalizeText(manualEvidence.businessName, 'Selected Business', 120);

  const domain = normalizeText(input.domain, 'website', 120);

  const ga4Card = getSignalCard(signals, 'ga4');
  const gtmCard = getSignalCard(signals, 'gtm');
  const googleAdsCard = getSignalCard(signals, 'google_ads');
  const metaPixelCard = getSignalCard(signals, 'meta_pixel');

  const googleAdsSignal = signals.googleAds || signals.google_ads;
  const metaPixelSignal = signals.metaPixel || signals.meta_pixel;
  const googleAdsConversionRequestDetected = Boolean(
    signals.googleAdsConversionRequestDetected ||
      signals.google_ads_conversion_request_detected ||
      googleAdsSignal?.conversionRequestDetected ||
      googleAdsSignal?.conversion_request_detected
  );

  const actionLabel =
    readManualText(manualEvidence, 'actionLabel', 'action_label', '', 120) ||
    readManualText(manualEvidence, 'futureTestTarget', 'future_test_target', '', 120) ||
    'Selected business action';

  const expectedEvent = readManualText(manualEvidence, 'expectedEvent', 'expected_event', '', 120);
  const observedEvent =
    readManualText(manualEvidence, 'observedEvent', 'observed_event', '', 140) ||
    readManualText(manualEvidence, 'observedEventName', 'observed_event_name', '', 140) ||
    readManualText(manualEvidence, 'eventName', 'event_name', '', 140);

  return {
    schemaVersion: normalizeText(input.schemaVersion || input.schema_version, 'trackflow-video-input-v1', 80),
    jobId: normalizeText(input.jobId || input.job_id, 'demo-job', 100),
    businessName,
    domain,
    websiteUrl: normalizeText(input.websiteUrl || input.website_url, '', 180),
    reportMode,
    trackingCase: input.trackingCase || input.tracking_case || {mode: reportMode},
    trackingSignals: {
      ga4: normalizeTrackingSignal(signals.ga4, signals.ga4Detected || signals.ga4_detected, signals.ga4Ids || signals.ga4_ids, ga4Card, 'GA4'),
      gtm: normalizeTrackingSignal(signals.gtm, signals.gtmDetected || signals.gtm_detected, signals.gtmIds || signals.gtm_ids, gtmCard, 'Google Tag Manager'),
      googleAds: normalizeTrackingSignal(
        googleAdsSignal,
        signals.googleAdsDetected || signals.google_ads_detected,
        signals.googleAdsIds || signals.google_ads_ids,
        googleAdsCard,
        'Google Ads tag',
        {conversionRequestDetected: googleAdsConversionRequestDetected}
      ),
      metaPixel: normalizeTrackingSignal(
        metaPixelSignal,
        signals.metaPixelDetected || signals.meta_pixel_detected,
        signals.metaPixelIds || signals.meta_pixel_ids,
        metaPixelCard,
        'Meta Pixel'
      )
    },
    manualEvidence: {
      businessName,
      actionLabel,
      futureTestTarget: readManualText(manualEvidence, 'futureTestTarget', 'future_test_target', actionLabel, 120),
      expectedEvent,
      observedEvent,
      actionCompleted: manualEvidence.actionCompleted || manualEvidence.action_completed || '',
      toolUsed: readManualText(manualEvidence, 'toolUsed', 'tool_used', '', 80) || readManualText(manualEvidence, 'tool', undefined, 'Tag Assistant', 80),
      ga4EventObserved: readManualText(manualEvidence, 'ga4EventObserved', 'ga4_event_observed', '', 80),
      googleAdsConversionObserved: readManualText(manualEvidence, 'googleAdsConversionObserved', 'google_ads_conversion_observed', '', 80),
      gtmTriggerObserved: readManualText(manualEvidence, 'gtmTriggerObserved', 'gtm_trigger_observed', '', 80),
      testUrl: readManualText(manualEvidence, 'testUrl', 'test_url', '', 180),
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
    visuals,
    clientSafeDisclaimer: normalizeText(
      input.clientSafeDisclaimer || input.client_safe_disclaimer,
      'Browser-visible review only. Final account-side confirmation is still recommended.',
      180
    )
  };
};
