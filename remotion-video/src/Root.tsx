import React from 'react';
import {Composition, registerRoot} from 'remotion';
import {TrackFlowEvidenceVideo} from './TrackFlowEvidenceVideo';
import type {TrackFlowVideoInput} from './types';

const defaultProps: TrackFlowVideoInput = {
  schemaVersion: 'trackflow-video-input-v1',
  jobId: 'demo-job',
  businessName: 'Example Business',
  domain: 'example.com',
  reportMode: 'ga4_event_verification',
  trackingCase: {
    mode: 'ga4_event_verification'
  },
  trackingSignals: {
    ga4Detected: true,
    ga4Ids: ['G-EXAMPLE123'],
    gtmDetected: true,
    gtmIds: ['GTM-EXAMPLE'],
    googleAdsDetected: true,
    googleAdsIds: ['AW-123456789'],
    googleAdsConversionRequestDetected: false,
    metaPixelDetected: false,
    metaPixelIds: []
  },
  selectedAction: {
    actionLabel: 'Contact Form Submission',
    expectedEvent: 'generate_lead',
    observedEvent: 'page_view only',
    actionCompleted: 'yes',
    toolUsed: 'Tag Assistant',
    ga4EventObserved: 'not_observed',
    googleAdsConversionObserved: 'not_observed',
    gtmTriggerObserved: 'not_observed'
  },
  visuals: [],
  clientSafeDisclaimer:
    'Browser-visible review only. Final account-side confirmation is still recommended.'
};

export const Root: React.FC = () => {
  return (
    <Composition
      id="TrackFlowEvidenceVideo"
      component={TrackFlowEvidenceVideo}
      durationInFrames={720}
      fps={30}
      width={1280}
      height={720}
      defaultProps={defaultProps}
    />
  );
};

registerRoot(Root);
