/**
 * API Route: /api/mirror/detect-crisis
 * Crisis pattern detection (safety-critical)
 */

import { NextApiRequest, NextApiResponse } from 'next';

const CRISIS_INDICATORS = [
  'want to die',
  'end it all',
  'no point',
  'cant go on',
  'worthless',
  'better off without me',
  'no reason to live',
  'suicide',
  'kill myself',
  'harm myself'
];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { content } = req.body;

  if (!content) {
    return res.status(400).json({ error: 'Content required' });
  }

  const lowerContent = content.toLowerCase();
  const detected = CRISIS_INDICATORS.some(indicator => lowerContent.includes(indicator));

  const result = {
    detected,
    severity: detected ? 'urgent' : 'none',
    confidence: detected ? 0.8 : 0,
    resources: detected ? {
      hotline: '988',
      text: '741741',
      url: 'https://988lifeline.org'
    } : null
  };

  res.status(200).json(result);
}
