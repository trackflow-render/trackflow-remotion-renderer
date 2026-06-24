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
    ga4: {
      detected: true,
      ids: ['G-EXAMPLE123']
    },
    gtm: {
      detected: true,
      ids: ['GTM-EXAMPLE']
    },
    googleAds: {
      detected: true,
      ids: ['AW-123456789'],
      conversionRequestDetected: false
    },
    metaPixel: {
      detected: false,
      ids: []
    }
  },
  manualEvidence: {
    businessName: 'Example Business',
    actionLabel: 'Contact Form Submission',
    expectedEvent: 'generate_lead / form_submit',
    observedEvent: 'page_view only',
    actionCompleted: true,
    toolUsed: 'Tag Assistant',
    ga4EventObserved: 'not clearly observed',
    googleAdsConversionObserved: 'not clearly observed',
    gtmTriggerObserved: 'not clearly observed'
  },
  visuals: [],
  clientSafeDisclaimer:
    'Browser-visible review and operator-provided evidence only. Final account-side confirmation is still recommended.'
};

export const Root: React.FC = () => {
  return (
    <Composition
      id="TrackFlowEvidenceVideo"
      component={TrackFlowEvidenceVideo}
      durationInFrames={1500}
      fps={30}
      width={1280}
      height={720}
      defaultProps={defaultProps}
    />
  );
};

registerRoot(Root);