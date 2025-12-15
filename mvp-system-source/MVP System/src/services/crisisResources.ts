/**
 * Crisis Resources Service
 * 
 * Constitutional Principles:
 * - Real, verified crisis hotlines
 * - Professional resources by country
 * - Exit strategy guidance
 * - Never mock content
 * - Updated regularly
 */

export interface CrisisHotline {
  name: string;
  phone: string;
  hours: string;
  description: string;
  url?: string;
}

export interface CrisisResources {
  country: string;
  hotlines: CrisisHotline[];
  onlineResources: Array<{
    name: string;
    url: string;
    description: string;
  }>;
  emergencyNumber: string;
}

class CrisisResourcesService {
  /**
   * Get crisis resources by country
   */
  getResources(country: string = 'US'): CrisisResources {
    const resources = this.resourcesByCountry[country] || this.resourcesByCountry['US'];
    return resources;
  }

  /**
   * Detect user's country (approximate)
   */
  async detectCountry(): Promise<string> {
    // In a real implementation, this would use geolocation or timezone
    // For now, default to US
    return 'US';
  }

  /**
   * Crisis resources by country
   */
  private resourcesByCountry: Record<string, CrisisResources> = {
    US: {
      country: 'United States',
      emergencyNumber: '911',
      hotlines: [
        {
          name: '988 Suicide & Crisis Lifeline',
          phone: '988',
          hours: '24/7',
          description: 'Free and confidential support for people in distress',
          url: 'https://988lifeline.org',
        },
        {
          name: 'Crisis Text Line',
          phone: 'Text HOME to 741741',
          hours: '24/7',
          description: 'Free crisis counseling via text message',
          url: 'https://www.crisistextline.org',
        },
        {
          name: 'SAMHSA National Helpline',
          phone: '1-800-662-4357',
          hours: '24/7',
          description: 'Treatment referral and information service',
          url: 'https://www.samhsa.gov/find-help/national-helpline',
        },
        {
          name: 'Veterans Crisis Line',
          phone: '988 (Press 1)',
          hours: '24/7',
          description: 'Support for veterans and their families',
          url: 'https://www.veteranscrisisline.net',
        },
        {
          name: 'The Trevor Project',
          phone: '1-866-488-7386',
          hours: '24/7',
          description: 'Crisis support for LGBTQ+ youth',
          url: 'https://www.thetrevorproject.org',
        },
      ],
      onlineResources: [
        {
          name: 'NAMI - National Alliance on Mental Illness',
          url: 'https://www.nami.org',
          description: 'Mental health resources and support',
        },
        {
          name: 'Psychology Today - Find a Therapist',
          url: 'https://www.psychologytoday.com/us/therapists',
          description: 'Directory of mental health professionals',
        },
        {
          name: 'Mental Health America',
          url: 'https://www.mhanational.org',
          description: 'Screening tools and resources',
        },
      ],
    },

    UK: {
      country: 'United Kingdom',
      emergencyNumber: '999',
      hotlines: [
        {
          name: 'Samaritans',
          phone: '116 123',
          hours: '24/7',
          description: 'Confidential emotional support',
          url: 'https://www.samaritans.org',
        },
        {
          name: 'Shout',
          phone: 'Text SHOUT to 85258',
          hours: '24/7',
          description: 'Free, confidential text support',
          url: 'https://giveusashout.org',
        },
        {
          name: 'Mind Infoline',
          phone: '0300 123 3393',
          hours: '9am-6pm, Mon-Fri',
          description: 'Mental health information and support',
          url: 'https://www.mind.org.uk',
        },
        {
          name: 'Papyrus HOPELINEUK',
          phone: '0800 068 4141',
          hours: '9am-midnight every day',
          description: 'Support for young people under 35',
          url: 'https://www.papyrus-uk.org',
        },
      ],
      onlineResources: [
        {
          name: 'NHS Mental Health Services',
          url: 'https://www.nhs.uk/mental-health',
          description: 'NHS mental health resources',
        },
        {
          name: 'Rethink Mental Illness',
          url: 'https://www.rethink.org',
          description: 'Support and information',
        },
      ],
    },

    CA: {
      country: 'Canada',
      emergencyNumber: '911',
      hotlines: [
        {
          name: '988 Suicide Crisis Helpline',
          phone: '988',
          hours: '24/7',
          description: 'Immediate support for anyone in crisis',
          url: 'https://988.ca',
        },
        {
          name: 'Talk Suicide Canada',
          phone: '1-833-456-4566',
          hours: '24/7',
          description: 'Bilingual crisis support',
          url: 'https://talksuicide.ca',
        },
        {
          name: 'Kids Help Phone',
          phone: '1-800-668-6868',
          hours: '24/7',
          description: 'Support for youth (also text CONNECT to 686868)',
          url: 'https://kidshelpphone.ca',
        },
        {
          name: 'Hope for Wellness Helpline',
          phone: '1-855-242-3310',
          hours: '24/7',
          description: 'Support for Indigenous peoples',
          url: 'https://www.hopeforwellness.ca',
        },
      ],
      onlineResources: [
        {
          name: 'Canadian Mental Health Association',
          url: 'https://cmha.ca',
          description: 'Mental health resources and support',
        },
        {
          name: 'Wellness Together Canada',
          url: 'https://www.wellnesstogether.ca',
          description: 'Free mental health and substance use support',
        },
      ],
    },

    AU: {
      country: 'Australia',
      emergencyNumber: '000',
      hotlines: [
        {
          name: 'Lifeline',
          phone: '13 11 14',
          hours: '24/7',
          description: 'Crisis support and suicide prevention',
          url: 'https://www.lifeline.org.au',
        },
        {
          name: 'Beyond Blue',
          phone: '1300 22 4636',
          hours: '24/7',
          description: 'Depression, anxiety, and suicide prevention support',
          url: 'https://www.beyondblue.org.au',
        },
        {
          name: 'Kids Helpline',
          phone: '1800 55 1800',
          hours: '24/7',
          description: 'Support for young people aged 5-25',
          url: 'https://kidshelpline.com.au',
        },
        {
          name: 'Suicide Call Back Service',
          phone: '1300 659 467',
          hours: '24/7',
          description: 'Telephone and online counseling',
          url: 'https://www.suicidecallbackservice.org.au',
        },
      ],
      onlineResources: [
        {
          name: 'Head to Health',
          url: 'https://headtohealth.gov.au',
          description: 'Australian Government mental health resources',
        },
        {
          name: 'SANE Australia',
          url: 'https://www.sane.org',
          description: 'Mental health support and information',
        },
      ],
    },

    NZ: {
      country: 'New Zealand',
      emergencyNumber: '111',
      hotlines: [
        {
          name: 'Lifeline Aotearoa',
          phone: '0800 543 354',
          hours: '24/7',
          description: 'Crisis support',
          url: 'https://www.lifeline.org.nz',
        },
        {
          name: '1737',
          phone: '1737',
          hours: '24/7',
          description: 'Free call or text for support',
          url: 'https://1737.org.nz',
        },
        {
          name: 'Youthline',
          phone: '0800 376 633',
          hours: '24/7',
          description: 'Support for young people (text 234 for free)',
          url: 'https://www.youthline.co.nz',
        },
        {
          name: 'Samaritans',
          phone: '0800 726 666',
          hours: '24/7',
          description: 'Confidential support',
          url: 'https://www.samaritans.org.nz',
        },
      ],
      onlineResources: [
        {
          name: 'Mental Health Foundation NZ',
          url: 'https://www.mentalhealth.org.nz',
          description: 'Mental health resources and support',
        },
        {
          name: 'Depression.org.nz',
          url: 'https://depression.org.nz',
          description: 'Resources on depression',
        },
      ],
    },
  };

  /**
   * Get international hotline (if country not in list)
   */
  getInternational(): CrisisHotline {
    return {
      name: 'International Association for Suicide Prevention',
      phone: 'See website for country list',
      hours: 'Varies by country',
      description: 'Directory of crisis centers worldwide',
      url: 'https://www.iasp.info/resources/Crisis_Centres',
    };
  }

  /**
   * Get immediate safety tips
   */
  getSafetyTips(): string[] {
    return [
      'If you are in immediate danger, call emergency services (911, 999, 000, etc.)',
      'Reach out to a trusted friend or family member',
      'Remove access to means of self-harm',
      'Stay in a safe, public place if possible',
      'Use a crisis hotline - they are available 24/7',
      'If possible, go to a hospital emergency room',
    ];
  }

  /**
   * Get professional resource recommendations
   */
  getProfessionalResources(): string[] {
    return [
      'Consider connecting with a licensed therapist or counselor',
      'Your primary care doctor can provide mental health referrals',
      'Many therapists offer sliding-scale fees or accept insurance',
      'Teletherapy options are widely available',
      'Employee Assistance Programs (EAP) often provide free counseling sessions',
      'Community mental health centers offer affordable services',
    ];
  }

  /**
   * Get self-care suggestions (gentle, non-prescriptive)
   */
  getSelfCareSuggestions(): string[] {
    return [
      'Talking to someone you trust can help',
      'Physical movement can sometimes shift internal state',
      'Some people find writing their thoughts helpful',
      'Being in nature has helped many people',
      'Creative expression provides an outlet for some',
      'Professional support is available and can make a difference',
    ];
  }
}

// Singleton instance
export const crisisResources = new CrisisResourcesService();
